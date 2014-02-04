# grunt-lazyload

Gruntplugin Lazy Loading

[![Build Status](https://travis-ci.org/raphaeleidus/grunt-lazyload.png)](https://travis-ci.org/raphaeleidus/grunt-lazyload)

## Getting Started
Install the module with: `npm install grunt-lazyload --save`

```javascript
var lazyloader = require('grunt-lazyload').lazyloader;
lazyloader.init(grunt);

lazyloader.load('grunt-contrib-jshint', 'jshint');
```

## Documentation
_(Coming soon)_

## Examples
*Setting up a lazyloader instance:*
```javascript
var lazyloader = require('grunt-lazyload').lazyloader;
lazyloader.init(grunt);
```
This is not truely a gruntplugin but a node module that adds an interface around grunt to allow lazy loading so you have to pass it an instance of grunt

*Lazy loading a library with a single task:*
```javascript
lazyloader.load('grunt-contrib-jshint', 'jshint');
```

*Lazy loading a library with multiple tasks:*
```javascript
lazyloader.load('grunt-some-plugin', ['task1', 'task2', 'task3']);
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 2/3/2014   - 0.2.2 (fix multitarget/paramater passing bug)
* 5/14/2013  - 0.2.0 (use an init function to pass in the grunt object)
* 5/14/2013  - 0.1.0
* 5/10/2013  - 0.0.6 (gruntplugin keyword added to npm)
* 5/10/2013  - 0.0.4 (Better tests)
* 5/9/2013   - 0.0.2
## License
Copyright (c) 2013 Raphael Eidus
Licensed under the MIT license.
