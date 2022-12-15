import {Context} from 'koa';

import {OAuthStartOptions} from '../types';

import Shopify from '@shopify/shopify-api';

import css from './client/polaris-css';
import itpHelper from './client/itp-helper';
import topLevelInteraction from './client/top-level-interaction';
import Error from './errors';

const HEADING = 'Enable cookies';
const BODY =
  'You must manually enable cookies in this browser in order to use this app within Shopify.';
const FOOTER = `Cookies let the app authenticate you by temporarily storing your preferences and personal
information. They expire after 30 days.`;
const ACTION = 'Enable cookies';

export default function createEnableCookies({prefix}: OAuthStartOptions) {
  return function enableCookies(ctx: Context) {
    const {query} = ctx;
    console.log('koa-shopify-auth createEnableCookies ==>', query);
    const shop = query.shop as string;
    const host = query.host as string;
    const decryptedHost = Buffer.from(host, 'base64').toString('ascii');
    let decryptedShop = '';
    if (decryptedHost?.length > 0) {
      decryptedShop = decryptedHost.split('/')[0];
    }
    if (shop == null && !decryptedShop?.length) {
      ctx.throw(400, Error.ShopParamMissing);
      return;
    }

    ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    ${css}
  </style>
  <base target="_top">
  <title>Redirecting…</title>

  <script>
    window.apiKey = "${Shopify.Context.API_KEY}";
    window.host = "${host}";
    window.shopOrigin = "https://${encodeURIComponent(shop || decryptedShop)}";

    ${itpHelper}
    ${topLevelInteraction(shop || decryptedShop, host, prefix)}
  </script>
</head>
<body>
  <main id="TopLevelInteractionContent">
    <div class="Polaris-Page">
      <div class="Polaris-Page__Content">
        <div class="Polaris-Layout">
          <div class="Polaris-Layout__Section">
            <div class="Polaris-Stack Polaris-Stack--vertical">
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Card">
                  <div class="Polaris-Card__Header">
                    <h1 class="Polaris-Heading">${HEADING}</h1>
                  </div>
                  <div class="Polaris-Card__Section">
                    <p>${BODY}</p>
                  </div>
                  <div class="Polaris-Card__Section Polaris-Card__Section--subdued">
                    <p>${FOOTER}</p>
                  </div>
                </div>
              </div>
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Stack Polaris-Stack--distributionTrailing">
                  <div class="Polaris-Stack__Item">
                    <button type="button" class="Polaris-Button Polaris-Button--primary" id="TopLevelInteractionButton">
                      <span class="Polaris-Button__Content"><span>${ACTION}</span></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;
  };
}
