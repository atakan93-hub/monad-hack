import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveUserId } from "@/lib/resolve-user";

// GET /api/market/direct?agent=0x...&client=0x...&status=pending
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const agent = searchParams.get("agent");
  const client = searchParams.get("client");
  const status = searchParams.get("status");
  const address = searchParams.get("address");

  try {
    let query = supabase
      .from("direct_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (agent) query = query.ilike("agent_address", agent);
    if (client) query = query.ilike("client_address", client);
    if (status) query = query.eq("status", status);
    if (address) {
      query = supabase
        .from("direct_requests")
        .select("*")
        .or(`client_address.ilike.${address},agent_address.ilike.${address}`)
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/market/direct
// Actions: create, accept, reject, syncEscrow
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "create": {
        const { clientAddress, agentAddress, amount, description, deadline } = body;
        if (!clientAddress || !agentAddress || !amount || !description) {
          return NextResponse.json(
            { error: "clientAddress, agentAddress, amount, and description are required" },
            { status: 400 },
          );
        }

        const clientId = await resolveUserId(clientAddress);
        const agentId = await resolveUserId(agentAddress);

        const { data, error } = await supabase
          .from("direct_requests")
          .insert({
            client_id: clientId,
            agent_id: agentId,
            client_address: clientAddress,
            agent_address: agentAddress,
            amount: Number(amount),
            description,
            deadline: deadline ?? null,
            status: "pending",
          })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "accept": {
        const { requestId, address } = body;
        if (!requestId || !address) {
          return NextResponse.json(
            { error: "requestId and address are required" },
            { status: 400 },
          );
        }

        // Verify caller is the agent
        const { data: req, error: reqErr } = await supabase
          .from("direct_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        if (reqErr) throw reqErr;

        if (req.agent_address.toLowerCase() !== address.toLowerCase()) {
          return NextResponse.json(
            { error: "Only the agent can accept this request" },
            { status: 403 },
          );
        }

        if (req.status !== "pending") {
          return NextResponse.json(
            { error: `Request is already ${req.status}` },
            { status: 400 },
          );
        }

        const { data, error } = await supabase
          .from("direct_requests")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", requestId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "reject": {
        const { requestId, address } = body;
        if (!requestId || !address) {
          return NextResponse.json(
            { error: "requestId and address are required" },
            { status: 400 },
          );
        }

        // Verify caller is the agent
        const { data: req, error: reqErr } = await supabase
          .from("direct_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        if (reqErr) throw reqErr;

        if (req.agent_address.toLowerCase() !== address.toLowerCase()) {
          return NextResponse.json(
            { error: "Only the agent can reject this request" },
            { status: 403 },
          );
        }

        if (req.status !== "pending") {
          return NextResponse.json(
            { error: `Request is already ${req.status}` },
            { status: 400 },
          );
        }

        const { data, error } = await supabase
          .from("direct_requests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", requestId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "syncEscrow": {
        const { requestId, escrowId, status } = body;
        if (!requestId) {
          return NextResponse.json(
            { error: "requestId is required" },
            { status: 400 },
          );
        }

        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (escrowId) updatePayload.escrow_id = escrowId;
        if (status) updatePayload.status = status;

        const { data, error } = await supabase
          .from("direct_requests")
          .update(updatePayload)
          .eq("id", requestId)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
