// Payment plugin for BillCard

module.exports = (options) => {
  const seneca = this;
  const plugin = 'payment';

  seneca.add({ role: plugin, cmd: 'pay' }, pay);

  function pay(args, done) {
    // TODO intergrate with your credit card vendor

    done(null, { success: true });
  }

  return { name: plugin };
};
