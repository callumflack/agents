# Accepted skill adaptations

These patches preserve Callum’s accepted local variants without forking whole external skill trees or changing their upstream ownership. The canonical `.agents/.skill-lock.json` retains each upstream source/path/tree and records `adaptation.baseTree`, the accepted result `tree`, the patch’s `patchSha256`, and its reason. The installer verifies all three before publishing restored content. Keep patches relative to the skill directory; never hand-edit expected hashes to bless unexplained drift.

The 13 unchanged local variants are `animate`, `animate-expo`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `find-animation-opportunities`, `improve-animations`, `pick-ui-library`, `review-animations`, `show-me`, `plannotator-compound`, `plannotator-setup-goal`, and `retro`.

`plannotator-visual-explainer` is the fourteenth adaptation: retain implicit invocation and Mermaid 11, while restoring the upstream diagram-shell reference and its checks. Installed Plannotator reports 0.27.14; the source tag `v0.27.14` (`421c6af4cde06e8c12e75b3c6a86e6765f469009`) locks Mermaid 11.17.2. Its ordinary CSS and caption-clipping repair do not require Mermaid 12.

The external installer must not overwrite these entries during routine maintenance. The Agents README owns update and verification steps. Commit the lock and its patches together; another machine needs the same Agents revision to reproduce them.
