/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
// const users = [
//   {
//     caption: 'User1',
//     // You will need to prepend the image path with your baseUrl
//     // if it is not '/', like: '/test-site/img/docusaurus.svg'.
//     image: '/img/docusaurus.svg',
//     infoLink: 'https://www.facebook.com',
//     pinned: true,
//   },
// ];

const siteConfig = {
  title: 'BarbelHisto', // Title for your website.
  tagline: 'Bitemporal data for Java applications',
  url: 'https://www.projectbarbel.org', // Your website URL
  baseUrl: '/', // Base URL for your project */
  // For github.io type URLs, you would set the url and baseUrl like:
  //   url: 'https://facebook.github.io',
  //   baseUrl: '/test-site/',

  // Used for publishing and more
  projectName: 'projectbarbel.github.io',
  organizationName: 'projectbarbel',
  // For top-level user or org sites, the organization is still the same.
  // e.g., for the https://JoelMarcey.github.io site, it would be set like...
  //   organizationName: 'JoelMarcey'
  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    {doc: 'getstarted', label: 'Docs'},
//    {doc: 'doc4', label: 'API'},
    {page: 'help', label: 'Help'}
  ],
  gaTrackingId : 'UA-135274031-1',
  // If you have users set above, you add it here:
//  users,

  /* path to images for header/footer */
  headerIcon: 'img/small_barbel.png',
  footerIcon: 'img/small_barbel.png',
  favicon: 'img/small_barbel.png',

  /* Colors for website */
  colors: {
    primaryColor: '#155C8F',
    secondaryColor: '#A1BED2',
  },

  separateCss: ['apidocs'],

  usePrism: ['java'],

  /* Custom fonts for website */
  /*
  fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },
  */

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} Niklas Schlimm`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'default',
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: 'img/logo_blau_weiss_klein.png',
  twitterImage: 'img/logo_blau_weiss_klein.png',

  docsSideNavCollapsible: true,

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  //   repoUrl: 'https://github.com/facebook/test-site',
};

module.exports = siteConfig;
