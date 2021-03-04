<p align="center"><img width="100" src="https://raw.githubusercontent.com/BenTaylorPublic/bengular/main/logo.svg" alt="Bengular logo"></p>


<p align="center">
    <a href="https://npmcharts.com/compare/bengular"><img src="https://img.shields.io/npm/dm/bengular.svg?sanitize=true" alt="Downloads"></a>
    <a href="https://www.npmjs.com/package/bengular"><img src="https://img.shields.io/npm/v/bengular.svg?sanitize=true" alt="Version"></a>
    <br>
    <a href="https://david-dm.org/bentaylorpublic/bengular"><img src="https://david-dm.org/bentaylorpublic/bengular.svg" alt="Dependencies"></a>
</p>

# Bengular

A simple dev and build tool for websites.

## Installation

```
npm install -g bengular
cd /path/to/new/project/
bengular init
bengular dev
```

## Features

- HTML, with HTML only components, to reduce code duplication
- TS, that compiles down to a single JS per page
- SCSS
- Shared TS files compiled down to a shared JS bundle available to all pages
- Live rebuilds and reloads
- Build format suited to hosting on Github Pages

## Commands

```
bengular help			Shows this help menu
bengular version		Shows bengular version info
bengular init			Initializes a bengular project
bengular <command> help		Shows options for the command
bengular build <options>	Builds
bengular dev <options>		Starts the dev server
```