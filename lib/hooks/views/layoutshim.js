/**
 * Module dependencies
 */

var path = require('path');
var semver = require('semver');

/**
 * Implement EJS layouts (a la Express 2)
 *
 * TODO:
 * Extrapolate this functionality to a separate hook
 * to make it easier for folks to extend it with support
 * for other view engines (e.g. hbs)
 *
 * @param  {Sails}   sails
 * @param  {Function} cb
 */

module.exports = function layoutshim (sails, cb) {

	// If layout config is set, attempt to use view partials/layout
	if (sails.config.views.layout) {

		// If `http` hook is not enabled, we can't use partials
		// (depends on express atm)
		if (sails.config.hooks.http) {

      // Get the view engine name
      var engineName = sails.config.views.engine.name || sails.config.views.engine.ext;

			// Use ejs-locals for all ejs templates
			if (engineName === 'ejs') {

				var ejsLayoutEngine = require('ejs-locals');

				// Wait until express is ready, then configure the view engine
				return sails.after('hook:http:loaded', function () {
					sails.log.verbose('Overriding ejs engine config with ejslocals to implement layout support...');
					sails.config.views.engine.fn = ejsLayoutEngine;
					cb();
				});
			}

			else if (engineName === 'ng2.html'){
				var ng2engine = require('angular2-universal-preview').ng2engine;

				// Wait until express is ready, then configure the view engine
				return sails.after('hook:http:loaded', function () {
					sails.log('Configuration with ng2html to implement layout support...');
					sails.config.views.engine.fn = ng2engine;
					cb();
				});
			}

			else if (engineName === 'handlebars') {
				var exphbs = require('express-handlebars');
				var handlebarsMajorVersion;
				try {
				  handlebarsMajorVersion = semver.major(require('express-handlebars/node_modules/handlebars').VERSION);
				} catch (e) {
				  try {
				    handlebarsMajorVersion = semver.major(require('handlebars').VERSION);
				  }
				  catch (e2) {
				    handlebarsVersion = null;
				  }
				}
				if (!handlebarsMajorVersion) {sails.log.warn('Could not determine Handlebars version; versions < 4.0.0 may introduce security risks (see https://snyk.io/test/npm/handlebars/3)');}
				else if (handlebarsMajorVersion < 4) {
					sails.log.warn('Using Handlebars v' + handlebarsMajorVersion + '.x; Versions < 4.0.0 may introduce security risks (see https://snyk.io/test/npm/handlebars/3).');
					sails.log.warn('When an updated version becomes available, you should be able to install it by updating your copy of Sails with `npm update`.');
				}
				return sails.after('hook:http:loaded', function() {
					sails.log.verbose('Overriding handlebars engine with express-handlebars to implement layout support...');
					var hbs = exphbs.create({
						defaultLayout: path.join('..', (sails.config.views.layout + '.' + (sails.config.views.extension || 'handlebars')) || ''),
						helpers: sails.config.views.helpers || {},
						partialsDir: path.join('views', sails.config.views.partials || '')
					});

					sails.config.views.engine.fn = hbs.engine;
					cb();
				});
			}

		}
	}

	return cb();
};