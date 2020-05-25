/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  'GET /': {
    view: 'pages/home',
    locals: {
      layout: 'layouts/main',
    }
  },

  // NGINX sometimes adds index.html directive. We want this to also direct to the homepage.
  'GET /index.html': {
    view: 'pages/home',
    locals: {
      layout: 'layouts/main',
    }
  },

  'GET /lore': {
    view: 'pages/lore',
    locals: {
      layout: 'layouts/main',
    }
  },

  'GET /members': {
    view: 'pages/members',
    locals: {
      layout: 'layouts/main',
    }
  },

  'GET /events': {
    view: 'pages/events',
    locals: {
      layout: 'layouts/main',
    }
  },

  'GET /rules': {
    view: 'pages/rules',
    locals: {
      layout: 'layouts/main',
    }
  },

  'GET /character/:character': function (req, res) {
    var character = req.param('character');
    return res.view('pages/character', { layout: 'layouts/main', character: character })
  },


};
