// utils/deleteAfter.js
async function deleteAfter(msgPromise, ms = 60000) {
  const msg = await msgPromise;
  setTimeout(() => {
    msg.delete().catch(() => {});
  }, ms);
}

module.exports = { deleteAfter };
