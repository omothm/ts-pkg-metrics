# TypeScript Package Metrics

[![npm version](https://badge.fury.io/js/ts-pkg-metrics.svg)](https://www.npmjs.com/package/ts-pkg-metrics)
![CI](https://github.com/omothm/ts-pkg-metrics/actions/workflows/ci.yml/badge.svg)

Measure the health of your app architecture

## Introduction

An app's architecture is sound if the boundaries between its packages are sharp. Boundaries are
sharp when packages are internally cohesive and externally loosely coupled. Such packages are also
extremely easy to extract out into a microservice.

This tool helps you measure a few critical metrics of your packages that translate directly to how
sound your architecture is.

## Installation

### Local install

You can install the tool locally into your project by running:

    $ npm install ts-pkg-metrics

You can then use by either running it via `npx`:

    $ npx ts-pkg-metrics <dir>

Or via `npm` by adding it to your `package.json` scripts:

```json
{
  "scripts": {
    "metrics": "ts-pkg-metrics <dir>"
  }
}
```

Then running it:

    $ npm run metrics

### Global install

If you choose to install this tool globally, run the following (you may need `sudo`):

    $ npm install --global ts-pkg-metrics

Then run it from anywhere:

    $ ts-pkg-metrics <dir>

## How to use

The CLI accepts only a single, optional argument&mdash;the project directory (`<dir>`):

    $ ts-pkg-metrics <dir>

You may omit the directory if your package structure is directly at the root level of your project.
But if you have your packages inside, say, a folder named `src`, you will need to specify `src` as
an argument.

Running this command will print a table listing all the detected packages along with their metrics.
Each **direct** folder inside `<dir>` is considered a standalone package.

## Metrics

_These metrics are described in detail in "Chapter 20: Principles of Package Design" of "Agile
Software Development: Principles, Patterns, and Practices" by Robert C. Martin._

### $N$ &ndash; Number of classes

The number of classes in the package.

The implementation in this tool counts the number of exported symbols of all modules within the
package. **Thus, a _class_ in this context is _any_ exported symbol.**

### $R$ &ndash; Internal relationships

The number of times a class has imported another class within the same package.

Note that if more than one class (exported symbol) exist in the same module (file) and depend on
each other, this metric won't reflect that. The tool depends on `import` statements to calculate
this metric. For the most accurate results, you may need to limit exported symbols per module to
one.

### $H$ &ndash; Relational cohesion

A metric that combines both $N$ and $R$ and is calculated as follows:

$$
H=\frac{R+1}{N}
$$

The higher this metric, the better.

### $A$ &ndash; Abstractness

The number of abstract classes in the package.

Interfaces, types, and abstract classes count into this metric. Any other exported symbol is
considered non-abstract.

### $C_a$ &ndash; Afferent couplings

The number of times another package has imported any symbol from within this package.

This metric represents how dependent other packages are on this package.

### $C_e$ &ndash; Efferent couplings

The number of times this package has imported any symbol from other packages.

This metric represents how dependent this package is on other packages.

The sum of all $C_a$ values is always equal to the sum of all $C_e$ values:

$$
\sum{C_a}=\sum{C_e}
$$

### $I$ &ndash; Instability

A metric that combines both $C_a$ and $C_e$ and is calculated as follows:

$$
I=\frac{C_e}{C_a+C_e}
$$

$I$ falls within the range $(0,1)$, where 0 means a completely stable package and 1 means a
completely instable package. Here, instability isn't a bad thing: it means that this package is
fully dependent on other packages while no other package is dependent on it. On the other hand,
stability means the package is fully independent of other packages while other packages depend on
it.

### $D$ &ndash; Normal distance

This metric measures how far this package is from the "sweet spot" of instability vs. abstractness.
In short, a fully abstract package should be fully stable, and a fully concrete package should be
fully instable:

$$
D=|A+I-1|
$$

$D$ falls within the range $(0,1)$. The lower this metric, the better.

## What to aim for

As a rule of thumb, a software architect should mostly focus on getting all the $H$ values as high
as possible while getting all the $D$ values as low as possible.
