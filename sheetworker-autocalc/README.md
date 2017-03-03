## Sheetworker Autocalc
[Roll20] character sheets can use both [sheet worker scripts] and
[autocalc fields]. However, the two features do not play together very well.

Autocalc fields store a string which is interpreted as a mathematical
calculation at runtime, and may contain references to other fields (including
other autocalc fields).

Sheet worker scripts are pieces of JavaScript code which run in a sandbox on the
client, trigger off changes to attributes on the character sheet, and are
capable of modifying attributes.

Autocalc fields do not actually change their value, even if the result of the
calculation is changing. Thus, for a sheet worker to see that an autocalc has
changed, it needs to listen to all of the component attributes (and if those
component attributes are also autocalc fields, the script needs to listen to
_that_ attribute's components, etc.). Further complicating matters, when a sheet
worker reads the value of an atuocalc field, it sees only the formula, not the
final result. Therefore, it is nontrivial to use a sheet worker to work with
autocalc fields.

**Sheetworker Autocalc** aims to smooth the interaction between these two
features, providing a function for sheet worker scripts to resolve one or more
atuocalc fields to their final results. The callback function passed to
`resolveAutocalc` will have one parameter, an object with a key for each of the
requested autocalc fields, as well as the value of every field referenced down
the chain. For example:

    // @{foo} = "3"
    // @{bar} = "2"
    // @{baz} = "@{foo} + @{bar}"
    resolveAutocalc('baz', function(values) {
        // values = { foo: 3, bar: 2, baz: 5 }
      });

The first parameter to `resolveAutocalc` can be either a string or an array of
strings. Each string should be the name of an attribute.

[Roll20]: https://roll20.net
[sheet worker scripts]: https://wiki.roll20.net/Sheet_Worker_Scripts
[autocalc fields]:
https://wiki.roll20.net/Building_Character_Sheets#Auto-Calculating_Values
