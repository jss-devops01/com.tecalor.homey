'use strict';

import Homey from 'homey';

module.exports = class TecalorApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Tecalor THZ-504 ESPHome App has been initialized');
    
    // Register any app-wide flow cards here if needed
    this.log('App initialization complete');
  }

};
