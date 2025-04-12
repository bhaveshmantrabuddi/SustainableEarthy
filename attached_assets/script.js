document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('link-button');
  const statusDiv = document.getElementById('status');

  button.onclick = async () => {
    try {
      // Fetch link token on user click
      const res = await fetch('/create_link_token', { method: 'POST' });

      const data = await res.json();

      if (!data.link_token) {
        statusDiv.innerHTML = `<p style="color:red;">No link_token returned</p>`;
        return;
      }

      const handler = Plaid.create({
        token: data.link_token,
        onSuccess: async function(public_token, metadata) {
          console.log("Success! Public token:", public_token);

          const exchangeRes = await fetch('/exchange_public_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token })
          });

          if (!exchangeRes.ok) {
            statusDiv.innerHTML = `<p style="color:red;">Token exchange failed</p>`;
            return;
          }

          const accountsRes = await fetch('/accounts');
          const accounts = await accountsRes.json();

          const txRes = await fetch('/transactions');
          const response = await txRes.json();
          const transactions = response.transactions.map(tx => ({
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
            payment_channel: tx.payment_channel
          }));

          const transactionHTML = transactions
            .map(tx => `
              <div class="transaction">
                <div>📅 ${tx.date}</div>
                <div>💳 ${tx.name}</div>
                <div>💰 $${Math.abs(tx.amount)}</div>
                <div>🏷️ ${tx.payment_channel}</div>
              </div>
            `).join('');

          statusDiv.innerHTML = `
            <h3>Transactions</h3>
            <div class="transactions-list">
              ${transactionHTML}
            </div>
          `;

          // Add some basic styling
          const style = document.createElement('style');
          style.textContent = `
            .transactions-list {
              max-height: 400px;
              overflow-y: auto;
              padding: 10px;
            }
            .transaction {
              border: 1px solid #ddd;
              padding: 10px;
              margin: 5px 0;
              border-radius: 4px;
              background: white;
            }
            .transaction div {
              margin: 2px 0;
            }
          `;
          document.head.appendChild(style);

        },
        onExit: function(err, metadata) {
          if (err) {
            console.error("Exited with error", err);
            statusDiv.innerHTML = `<p style="color:red;"> ${err.message}</p>`;
          }
        }
      });

      handler.open();
    } catch (err) {
      console.error("Error initializing Plaid Link:", err);
      statusDiv.innerHTML = `<p style="color:red;"> ${err.message}</p>`;
    }
  };
});
