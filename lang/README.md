# Translations

Every word on the openseat website and in the iPhone and Android apps comes from the XML files in this folder. One file per language:

| File | Language |
| --- | --- |
| `en.xml` | English. Every other file follows this one. |
| `ar.xml` | Arabic (right to left) |
| `fr.xml` | French |

New languages and fixes are welcome. You only need a text editor or the GitHub website.

## Fix a translation

1. Open the language file on GitHub and press the pencil icon.
2. Change the text between the tags. Leave the `key` and anything in `{curly braces}` as they are.
3. Propose the change. A check runs on your pull request and tells you if something is off.

## Add a language

1. Copy `en.xml` to a new file named with the language code, such as `de.xml` for German or `pt-BR.xml` for Brazilian Portuguese.
2. Change the first tag:

   ```xml
   <language code="de" name="Deutsch" english="German" dir="ltr" locale="de-DE" numbers="de-DE">
   ```

   - `code` matches the file name.
   - `name` is the language's name in that language. It appears in the language menu.
   - `english` is the name in English.
   - `dir` is `ltr` for left to right or `rtl` for right to left (Arabic, Hebrew, Persian, Urdu).
   - `locale` sets how dates are written; `numbers` sets how numbers and prices are written. Usually both are the same.

3. Translate the text. You can leave a string out, or translate a few sections at a time. Anything missing shows in English, and the build lists what is left.
4. Open a pull request. Once it merges, the language shows up in the menu on the site and in the apps' settings with no code change.

## The format

```xml
<section name="search">
  <!-- Plain text. -->
  <text key="sameAirport">Pick two different airports to see seats.</text>

  <!-- Text with values filled in by the app. Keep each {name}, move it where your grammar needs it. -->
  <text key="chipLabel">{what}: {value}</text>

  <!-- Text that changes with a number. Use the forms your language has. -->
  <plural key="pax">
    <one>{n} traveller</one>
    <other>{n} travellers</other>
  </plural>

  <!-- A list. Keep the same number of items as English. -->
  <list key="weekdays">
    <item>Mon</item>
    ...
  </list>
</section>
```

- **Plural forms** are `zero`, `one`, `two`, `few`, `many` and `other`, following the [Unicode plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) for your language. `other` is required; leave out forms your language does not use. Arabic uses all six; French and English use `one` and `other`.
- **Spaces.** Line breaks and runs of spaces inside a tag fold into one space, so you can wrap long lines. To keep spaces at the start or end, add `xml:space="preserve"`, as in `flight.and`.
- **Special characters.** Write `&` as `&amp;` and `<` as `&lt;`.
- **The search sentence** (`search.sentence`) holds the six pickers as `{program}`, `{cabin}`, `{pax}`, `{from}`, `{to}` and `{ret}`. Put them in the order that reads naturally.
- **Names** (`names`) hold cabins, programs and cities. Use the names people know in your language, such as "Londres" in French.
- **Style.** Short, plain words. No em dashes.

## Check your file

With Node 22 installed, from the top folder of the repository:

```
npm run lang
```

It reports the line of any mistake, such as a misspelled key or a `{name}` that English does not have, and lists the strings still in English. The same check runs in CI on every pull request, and `npm test` checks that Arabic and French are complete.

## How it works

`scripts/lang.mjs` reads these files and writes `apps/web/src/i18n/lang-data.ts`, which the website and the apps import. It runs on `npm install`, before the dev servers and builds, and again whenever a file here changes while `npm run dev` is running. The generated file is not committed. `apps/web/src/i18n/strings.ts` maps each key to the place it appears.
