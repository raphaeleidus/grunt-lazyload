# grunt-lazyload

Gruntplugin Lazy Loading

_The Api has been changed to extend the grunt object, rather than provide a new wrapping object. For documentation on the old api (v0.2.2 and below) go here: [v0.2.2](https://github.com/raphaeleidus/grunt-lazyload/tree/v0.2.2)_

[![Build Status](https://travis-ci.org/raphaeleidus/grunt-lazyload.png)](https://travis-ci.org/raphaeleidus/grunt-lazyload)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## Getting Started
Install the module with: `npm install grunt-lazyload --save`

```javascript
require('grunt-lazyload')(grunt);

grunt.lazyLoadNpmTasks('grunt-contrib-jshint', 'jshint');
```

## Documentation
_(Coming soon)_

## Examples
### Adding lazyloading to grunt:
```javascript
require('grunt-lazyload')(grunt);
```
This is not truely a gruntplugin but a node module that adds an extra method to grunt to allow lazy loading so you have to pass it an instance of grunt for it to modify

### Lazy loading a library with a single task:
```javascript
grunt.lazyLoadNpmTasks('grunt-contrib-jshint', 'jshint');
```

### Lazy loading a library with multiple tasks:
```javascript
grunt.lazyLoadNpmTasks('grunt-some-plugin', ['task1', 'task2', 'task3']);
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 2/4/2014   - 1.0.0 (simplify code and improve api)
* 2/3/2014   - 0.2.2 (fix multitarget/paramater passing bug)
* 5/14/2013  - 0.2.0 (use an init function to pass in the grunt object)
* 5/14/2013  - 0.1.0
* 5/10/2013  - 0.0.6 (gruntplugin keyword added to npm)
* 5/10/2013  - 0.0.4 (Better tests)
* 5/9/2013   - 0.0.2

## License
Copyright (c) 2013 Raphael Eidus
Licensed under the MIT license.
