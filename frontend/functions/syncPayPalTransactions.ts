import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paypal_connection_id, transactions } = body;

    if (!paypal_connection_id || !Array.isArray(transactions)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Créer les transactions PayPal
    const createdTransactions = await base44.asServiceRole.entities.PayPalTransaction.bulkCreate(
      transactions.map(t => ({
        transaction_id: t.id,
        paypal_connection_id,
        amount: parseFloat(t.amount.value),
        currency: t.amount.currency_code,
        transaction_date: t.create_time,
        status: t.status.toLowerCase(),
        payer_email: t.payer?.email_address || '',
        payer_name: t.payer?.name?.given_name + ' ' + t.payer?.name?.surname || '',
        subject: t.description || 'PayPal Transaction',
        fee: t.fees_amount?.value ? parseFloat(t.fees_amount.value) : 0,
        net_amount: (parseFloat(t.amount.value) - (t.fees_amount?.value ? parseFloat(t.fees_amount.value) : 0))
      }))
    );

    // Mettre à jour le statut de synchronisation
    await base44.asServiceRole.entities.PayPalConnection.update(paypal_connection_id, {
      last_sync: new Date().toISOString(),
      sync_status: 'synced',
      error_message: null
    });

    return Response.json({
      success: true,
      transactionsCreated: createdTransactions.length,
      message: `${createdTransactions.length} transactions importées`
    });
  } catch (error) {
    console.error('PayPal sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});