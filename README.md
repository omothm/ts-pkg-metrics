# TypeScript Package Metrics

[![npm version](https://badge.fury.io/js/ts-pkg-metrics.svg)](https://www.npmjs.com/package/ts-pkg-metrics)
![CI](https://github.com/omothm/ts-pkg-metrics/actions/workflows/ci.yml/badge.svg)

Measure the health of your app architecture

![Example output](/imgs/graph.png)

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

    $ npx ts-pkg-metrics [options]

Or via `npm` by adding it to your `package.json` scripts:

```json
{
  "scripts": {
    "metrics": "ts-pkg-metrics [options]"
  }
}
```

Then running it:

    $ npm run metrics

### Global install

If you choose to install this tool globally, run the following (you may need `sudo`):

    $ npm install --global ts-pkg-metrics

Then run it from anywhere:

    $ ts-pkg-metrics [options]

## How to use

The CLI accepts one optional argument and some options:

    $ ts-pkg-metrics [options] [project-dir]

### Arguments

#### `project-dir`

The directory of the project. You may omit it if your package structure is directly at the root
level of your project. But if you have your packages inside, say, a folder named `src`, you will
need to specify `src` as the argument.

Running this command will print a table listing all the detected packages along with their metrics.
Each **direct** folder inside `project-dir` is considered a standalone package.

### Options

#### `-s, --safe <pkgs...>`

Specifies a list of packages that are _dependency-safe_ ([see below](#s---dependency-safety)).

#### `-t, --ts-config <config-dir>`

If your `tsconfig.json` file lives somewhere other than the root directory, you may specify it here.

#### `-r, --reporter <type>`

The type of reporter (how the results are printed). Currently, there are two reporters:

| Graph                              | Plain                              |
| ---------------------------------- | ---------------------------------- |
| ![Graph reporter](/imgs/graph.png) | ![Plain reporter](/imgs/plain.png) |

## Metrics

_These metrics are described in detail in "Chapter 20: Principles of Package Design" of "Agile
Software Development: Principles, Patterns, and Practices" by Robert C. Martin._

### _N_ - Number of classes

The number of classes in the package.

The implementation in this tool counts the number of exported symbols of all modules within the
package. **Thus, a _class_ in this context is _any_ exported symbol.**

### _R_ - Internal relationships

The number of times a class has imported another class within the same package.

Note that if more than one class (exported symbol) exist in the same module (file) and depend on
each other, this metric won't reflect that. The tool depends on `import` statements to calculate
this metric. For the most accurate results, you may need to limit exported symbols per module to
one.

### _H_ - Relational cohesion

A metric that combines both _N_ and _R_ and is calculated as follows:

_H_ = (_R_ + 1) / _N_

The higher this metric, the better.

### _A_ - Abstractness

The number of abstract classes in the package.

Interfaces, types, and abstract classes count into this metric. Any other exported symbol is
considered non-abstract.

### _C<sub>a</sub>_ - Afferent couplings

The number of times another package has imported any symbol from within this package.

This metric represents how dependent other packages are on this package.

### _C<sub>e</sub>_ - Efferent couplings

The number of times this package has imported any symbol from other packages.

This metric represents how dependent this package is on other packages.

The sum of all _C<sub>a</sub>_ values is always equal to the sum of all _C<sub>e</sub>_ values:

&Sigma; _C<sub>a</sub>_ = &Sigma; _C<sub>e</sub>_

### _I_ - Instability

A metric that combines both _C<sub>a</sub>_ and _C<sub>e</sub>_ and is calculated as follows:

_I_ = _C<sub>e</sub>_ / (_C<sub>a</sub>_ + _C<sub>e</sub>_)

_I_ falls within the range (0,1), where 0 means a completely stable package and 1 means a
completely instable package. Here, instability isn't a bad thing: it means that this package is
fully dependent on other packages while no other package is dependent on it. On the other hand,
stability means the package is fully independent of other packages while other packages depend on
it.

### _S_ - Dependency-safety

_S_ is a _flag_ set by the user that marks a package as _dependency-safe_. That is, it means a
package is safe to be both stable and concrete. A user may decide that a package is dependency-safe
in certain cases such as:

- **Presentational packages**: A package that has concrete implementations of UI components will
  probably be highly stable (many packages depend on it).
- **Non-volatile packages**: A package may have a concrete implementation of a utility class (e.g.,
  a `StringUtils` class) that is known for the client to be highly non-volatile (it won't change
  much).

The value is either 0 or 1, with 0 being the default.

### _D_ - Normal distance

This metric measures how far this package is from the "sweet spot" of instability vs. abstractness.
In short, a fully abstract package should be fully stable, and a fully concrete package should be
fully instable:

_D_ = | _A_ + _I_ &minus; 1 |

_D_ falls within the range (0,1). The lower this metric, the better.

If _S_ is set to 1, it overrides the value of _I_ in the equation. The normal distance becomes the
same as the abstractness.

If the value of _D_ is calculated without the absolute function, then its sign is interpreted as
follows:

- If negative, the package is too concrete for its stability. Dealing with such packages is
  generally _painful_.
- If positive, the package is too abstract for its instability. Such packages generally indicate a
  bad design as they are expected to be more stable for being abstract. They are generally
  considered _useless_.

## What to aim for

As a rule of thumb, a software architect should mostly focus on getting all the _H_ values as high
as possible while getting all the _D_ values as low as possible.
