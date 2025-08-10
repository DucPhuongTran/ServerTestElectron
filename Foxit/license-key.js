(function (root, factory) { if (typeof exports === 'object' && typeof module === 'object') { module.exports = factory(); } else if (typeof define === 'function' && define.amd) { define([], factory); } else { const a = factory(); for (const i in a) (typeof exports === 'object' ? exports : root)[i] = a[i]; } }(self, () => ({
    licenseSN: 'SN',
  licenseKey: 'Key',
  })));