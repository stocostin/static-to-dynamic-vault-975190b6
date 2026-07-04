## Preserve the original green "Request Quote" button on shop cards

The CMS-rendered product cards currently emit `<a class="btn btn-primary">Enquire on WhatsApp</a>`, which reverted to the site's default primary style after the legacy `shop.js` was stripped. The original green pill button with the WhatsApp icon and "Request Quote" label is already styled in `public/assets/css/shop.css` as `.quote-btn`.

### Change

In `src/lib/legacy-hydrate.server.ts`, inside `renderProductCards`, replace the button markup with:

```html
<a href="https://wa.me/254721499606?text=..." target="_blank" class="quote-btn">
  <i class="fab fa-whatsapp"></i> Request Quote
</a>
```

That's the only change. Same href, same target, same message text — just the class and label/icon are restored so the existing `.quote-btn` CSS renders the green pill exactly as it looked before.

### Out of scope

- No changes to product card layout, images, price, or other buttons.
- No CSS edits — `.quote-btn` already exists in `shop.css`.
- No changes to portfolio or home cards.
