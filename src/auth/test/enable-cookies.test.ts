import '../../test/test_helper';
import querystring from 'querystring';

import {createMockContext} from '@shopify/jest-koa-mocks';
import Error from '../errors';

import createEnableCookies from '../create-enable-cookies';
import Shopify from '@shopify/shopify-api';

const query = querystring.stringify.bind(querystring);
const baseUrl = 'myapp.com/auth';
const shop = 'shop1.myshopify.io';
const shopOrigin = 'https://shop1.myshopify.io';
const host = 'c2hvcDEubXlzaG9waWZ5LmlvL2FkbWlu';

const baseConfig = {};

const baseConfigWithPrefix = {
  ...baseConfig,
  prefix: '/shopify',
};

describe('CreateEnableCookies', () => {
  it('sets body to the enable cookies HTML page', () => {
    const enableCookies = createEnableCookies(baseConfig);
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop, host})}`,
    });

    enableCookies(ctx);

    expect(ctx.body).toContain('CookiePartitionPrompt');
    expect(ctx.body).toContain(Shopify.Context.API_KEY);
    expect(ctx.body).toContain(shopOrigin);
    expect(ctx.body).toContain(
      `redirectUrl: "/auth?shop=${shop}&host=${host}"`,
    );
  });

  it('sets body to the enable cookies HTML page with prefix', () => {
    const {prefix} = baseConfigWithPrefix;
    const enableCookies = createEnableCookies(baseConfigWithPrefix);
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop, host})}`,
    });

    enableCookies(ctx);

    expect(ctx.body).toContain('CookiePartitionPrompt');
    expect(ctx.body).toContain(Shopify.Context.API_KEY);
    expect(ctx.body).toContain(shopOrigin);
    expect(ctx.body).toContain(
      `redirectUrl: "${prefix}/auth?shop=${shop}&host=${host}"`,
    );
  });

  it('throws a 400 if there is no shop', () => {
    const enableCookies = createEnableCookies(baseConfig);
    const ctx = createMockContext({
      url: `https://${baseUrl}`,
    });

    enableCookies(ctx);
    expect(ctx.throw).toHaveBeenCalledWith(400, Error.ShopParamMissing);
  });
});
