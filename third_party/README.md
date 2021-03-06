All code not owned by Google must be placed in a subdirectory here, and must
comply with Google policies on third party software.

The first commit of a new piece of third party software must be unmodified from
the original. There must be a file named `LICENSE` at the third party software's
root directory containing the software's license (if the software's distribution
has another file containing the license, rename it to `LICENSE`), as well as a
file named `METADATA`. The `METADATA` file looks like:

    name: "Foo Framework"
    description:
        "The Foo framework allows Bar frobbers to be registered. This avoids "
        "memory duplication as in //path/to/alternate/frobber:bar."

    third_party {
      url {
        type: HOMEPAGE
        value: "https://yoyodyne.com/"
      }
      url {
        type: GIT
        value: "https://github.com/yoyodyne/foo"
      }
      version: "X.Y.Z"
      last_upgrade_date { year: 2014 month: 10 day: 20 }
      local_modifications: "Changed something important."
    }

The `local_modifications` field is used for noting changes made to the third
party directory and source, including renaming or creating a `LICENSE` file.
Simple changes can be summarized as "see git log."

Due to the nature of this repository, third party code may be entirely
unnecessary, but this documentation is included for completeness.