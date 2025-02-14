import {Context} from 'koa';

import Shopify from '@shopify/shopify-api';
import fs from 'fs';
import path from 'path';

import {OAuthStartOptions} from '../types';
import css from './client/polaris-css';
import itpHelper from './client/itp-helper';
import requestStorageAccess from './client/request-storage-access';
import storageAccessHelper from './client/storage-access-helper';
import Error from './errors';

const HEADING = 'This app needs access to your browser data';
const BODY =
  'Your browser is blocking this app from accessing your data. To continue using this app, click Continue, then click Allow if the browser prompts you.';
const ACTION = 'Continue';

const APP_BRIDGE_SCRIPT = fs.readFileSync(
  path.resolve(`${__dirname}/../app-bridge-2.0.12.js`),
);

export default function createRequestStorageAccess({
  prefix,
}: OAuthStartOptions) {
  return function requestStorage(ctx: Context) {
    const {query, request} = ctx;
    // console.log(
    //   '[koa-shopify-auth/createRequestStorageAccess] requestStorage ==>',
    //   {
    //     prefix,
    //     ctx,
    //     header: request?.header,
    //     query,
    //   },
    // );
    const shop = query.shop as string;
    const host = query.host as string;

    let emergencyShopParam = '';
    if (!shop) {
      // Try to get the shop value by decrypt the host param.
      if (host) {
        const decryptedHost = host
          ? Buffer.from(host, 'base64').toString('ascii')
          : '';
        if (decryptedHost?.length) {
          emergencyShopParam = decryptedHost.split('/')[0];
          console.log(
            '[koa-shopify-auth/createRequestStorageAccess] Fetch emergencyShopParam from host param ==>',
            {decryptedHost, emergencyShopParam},
          );
        }
      }

      // If the code above doesn't work, try this instead.
      if (!emergencyShopParam?.length) {
        // A super hacky way to get the shop param from header's referer's params. Do not try this at home.
        const header = request?.header;
        // referer: 'https://your-heroku-url.herokuapp.com/?embedded=1&hmac=HMAC&host=ENCRYPTED_HOST&locale=ja-JP&session=SESSION&shop=your-shop-url.myshopify.com&timestamp=1234567890'
        if (header?.referer) {
          const paramString = header?.referer.split('?')[1];
          const queryString = new URLSearchParams(paramString);

          for (const pair of queryString.entries()) {
            if (pair[0] === 'shop') {
              emergencyShopParam = pair[1];
              console.log(
                '[koa-shopify-auth/createRequestStorageAccess] Fetch emergencyShopParam from header.referer params ==>',
                {referer: header?.referer, emergencyShopParam},
              );
            }
          }
        }
      }
    }

    if (shop == null && !emergencyShopParam?.length) {
      console.log(
        '[koa-shopify-auth/createRequestStorageAccess] ctx.throw(400, Error.ShopParamMissing) ==>',
        {query, request},
      );
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

  <script>${APP_BRIDGE_SCRIPT}</script>
  <script>
    window.apiKey = "${Shopify.Context.API_KEY}";
    window.host = "${host}";
    window.shopOrigin = "https://${encodeURIComponent(
      shop || emergencyShopParam,
    )}";
    ${itpHelper}
    ${storageAccessHelper}
    ${requestStorageAccess(shop || emergencyShopParam, host, prefix)}
  </script>
</head>
<body>
  <main id="RequestStorageAccess">
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
                </div>
              </div>
              <div class="Polaris-Stack__Item">
                <div class="Polaris-Stack Polaris-Stack--distributionTrailing">
                  <div class="Polaris-Stack__Item">
                    <button type="button" class="Polaris-Button Polaris-Button--primary" id="TriggerAllowCookiesPrompt">
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
