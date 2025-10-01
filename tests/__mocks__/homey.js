// Simple mock for Homey module
module.exports = {
  Device: class MockDevice {
    log() {}
    error() {}
    registerCapabilityListener() {}
    setCapabilityValue() {}
    getSettings() { return {}; }
  },
  Driver: class MockDriver {
    log() {}
    error() {}
  },
  App: class MockApp {
    log() {}
    error() {}
  }
};
