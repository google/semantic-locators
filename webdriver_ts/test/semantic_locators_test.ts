/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {By, promise as webDriverPromise, WebElement} from 'selenium-webdriver';  // from //third_party/javascript/typings/selenium_webdriver:selenium_webdriver_3_0_0

import {bySemanticLocator, closestPreciseLocatorFor, closestSimpleLocatorFor, findElementBySemanticLocator, findElementsBySemanticLocator, preciseLocatorFor, simpleLocatorFor} from '../src/semantic_locators';
import {DRIVERS} from '../src/web_drivers';

pdescribe('semantic locators on', DRIVERS, (driverFactory) => {
  const driver = driverFactory();
  afterAll(async () => {
    await driver.quit();
  });

  const elementParameters: Array<[string, {locator: string, html: string}]> = [
    [
      'when single quoted',
      {
        locator: '{button \'OK\'}',
        html: '<button id=\'target\'>OK</button>',
      },
    ],
    [
      'when double quoted',
      {
        locator: '{button "OK"}',
        html: '<button id=\'target\'>OK</button>',
      },
    ],
    [
      'when nested',
      {
        locator: '{list} {listitem}',
        html: '<ul><li id=\'target\'>foo</li></ul>',
      },
    ],
    [
      'with content suffix matching',
      {
        locator: '{button \'*and_end\'}',
        html: '<button id=\'target\'>beginning_and_end</button>',
      },
    ],
    [
      'with content prefix matching',
      {
        locator: '{button \'beginning_and*\'}',
        html: '<button id=\'target\'>beginning_and_end</button>',
      },
    ],
    [
      'with content interior matching',
      {
        locator: '{button \'*and*\'}',
        html: '<button id=\'target\'>beginning_and_end</button>',
      },
    ],
    [
      'with outer',
      {
        locator: '{region} outer {list}',
        html:
            '<div role=\'region\'><ul id=\'target\'><li><ul><li>foo</li></ul></li></ul></div>',
      },
    ],
    [
      'with fancy chars',
      {
        locator: '{button' +
            ' \'блČλñéç\u202aहिन्दी\u202c日本語\u202c\u202a한국어\u202cй\u202aไ🤖-—–;|<>!"_+\'}',
        html: '<button id=\'target\'' +
            ' aria-label=\'блČλñéç\u202aहिन्दी\u202c日本語\u202c\u202a한국어\u202cй\u202aไ🤖-—–;|<>!&quot;_+\'>OK</button>'
      },
    ],
    [
      'with escaped quotes',
      {
        locator:
            '{ button \'\\\'escaped quotes\\\\\\\' and unescaped\\\\\\\\\'}',
        html:
            '<button id=\'target\'>\'escaped quotes\\\' and unescaped\\\\</button>',
      },
    ],
  ];

  pdescribe(
      '',
      [
        [
          'bySemanticLocator()', {
            single: (locator: string, parent?: WebElement) =>
                (parent ?? driver).findElement(bySemanticLocator(locator)),
            multi: (locator: string, parent?: WebElement) =>
                (parent ?? driver).findElements(bySemanticLocator(locator))
          }
        ],
        [
          'findElementBySemanticLocator()', {
            single: (locator: string, parent?: WebElement) =>
                findElementBySemanticLocator(driver, locator, parent)
          }
        ],
        [
          'findElementsBySemanticLocator()', {
            multi: (locator: string, parent?: WebElement) =>
                findElementsBySemanticLocator(driver, locator, parent)
          }
        ],
      ],
      ({single = null, multi = null}) => {
        if (single) {
          pit('finds single elements', elementParameters,
              async ({locator, html}) => {
                await renderHtml(html);

                const element = await single(locator);
                expect(await element.getAttribute('id')).toBe('target');
              });

          it('finds single elements within contexts', async () => {
            await renderHtml(
                '<button>OK</button><div id=\'container\'><button id=\'target\'>OK</button></div>');
            const element = await single(
                '{button \'OK\'}', driver.findElement(By.id('container')));
            expect(await element.getAttribute('id')).toBe('target');
          });

          it('throws error if no element was found', async () => {
            await expectAsync(
                single('{button \'this label does not exist\'}') as
                Promise<never>)
                .toBeRejectedWithError();
          });
        }

        if (multi) {
          pit('finds multiple elements', elementParameters,
              async ({locator, html}) => {
                await renderHtml(
                    html + html.replace('id=\'target\'', 'id=\'target2\''));
                const elements = await multi(locator);
                expect(elements).toHaveSize(2);
                expect(await elements[0].getAttribute('id')).toBe('target');
                expect(await elements[1].getAttribute('id')).toBe('target2');
              });
          it('finds duplicates', async () => {
            await renderHtml(
                '<button>OK</button><button aria-label=\'OK\'>foo</button><div role=\'button\'>OK</div>');
            expect(await multi('{button \'OK\'}')).toHaveSize(3);
          });

          it('finds multiple elements within contexts', async () => {
            await renderHtml(
                '<button>OK</button><div id=\'container\'><button id=\'target\'>OK</button><button id=\'target2\'>OK</button></div>');
            const elements = await multi(
                '{button \'OK\'}', driver.findElement(By.id('container')));
            expect(elements).toHaveSize(2);
            expect(await elements[0].getAttribute('id')).toBe('target');
            expect(await elements[1].getAttribute('id')).toBe('target2');
          });

          it('succeeds error if no element was found', async () => {
            await expectAsync(
                multi('{button \'this label does not exist\'}') as
                Promise<WebElement[]>)
                .toBeResolvedTo([]);
          });
        }

        const either = single || multi;

        if (either) {
          pit('throws error for an invalid syntax such as a',
              [
                ['missing closing brace', '{button \'OK\''],
                ['missing closing quote', '{button \'OK\\\'}']
              ],
              async (locator) => {
                await expectAsync(either(locator) as Promise<never>)
                    .toBeRejectedWithError();
              });
        }
      });

  pdescribe(
      'for a target at',
      [
        [
          '#root + button',
          {
            html: '<div id=\'root\'></div><button id=\'target\'>OK</button>',
            closestPrecise: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            precise: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            simple: {
              noRoot: '{button \'OK\'}',
            },
          },
        ],
        [
          '#root + ul > li > button',
          {
            html:
                '<div id=\'root\'></div><ul><li><button id=\'target\'>OK</button></li></ul><button>OK</button>',
            closestPrecise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: Error,
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            precise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: Error,
            },
            simple: {
              noRoot: '{button \'OK\'}',
            },
          },
        ],
        [
          '#root + button > div',
          {
            html:
                '<div id=\'root\'></div><button><div id=\'target\'>OK</div></button>',
            closestPrecise: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: Error,
            },
            precise: {
              noRoot: null,
              withRoot: Error,
            },
            simple: {
              noRoot: null,
            },
          },
        ],
        [
          '#root > button',
          {
            html: '<div id=\'root\'><button id=\'target\'>OK</button></div>',
            closestPrecise: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            precise: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            simple: {
              noRoot: '{button \'OK\'}',
            },
          },
        ],
        [
          '#root > ul > li > button',
          {
            html:
                '<div id=\'root\'><ul><li><button id=\'target\'>OK</button></li></ul></div><button>OK</button>',
            closestPrecise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            precise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            simple: {
              noRoot: '{button \'OK\'}',
            },
          },
        ],
        [
          '#root > button > div',
          {
            html:
                '<div id=\'root\'><button><div id=\'target\'>OK</div></button></div>',
            closestPrecise: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            precise: {
              noRoot: null,
              withRoot: null,
            },
            simple: {
              noRoot: null,
            },
          },
        ],
        [
          'button + ul > li#root > button > div',
          {
            html:
                '<button>OK</button><ul><li id=\'root\'><button><div id=\'target\'>OK</div></button></li></ul>',
            closestPrecise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            precise: {
              noRoot: null,
              withRoot: null,
            },
            simple: {
              noRoot: null,
            },
          },
        ],
        [
          'button + ul > li > button#root > div',
          {
            html:
                '<button>OK</button><ul><li><button id=\'root\'><div id=\'target\'>OK</div></button></li></ul>',
            closestPrecise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: null,
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: null,
            },
            precise: {
              noRoot: null,
              withRoot: null,
            },
            simple: {
              noRoot: null,
            },
          },
        ],
        [
          'button + ul > li#root > button',
          {
            html:
                '<button>OK</button><ul><li id=\'root\'><button id=\'target\'><div>OK</div></button></li></ul>',
            closestPrecise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            closestSimple: {
              noRoot: '{button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            precise: {
              noRoot: '{listitem} {button \'OK\'}',
              withRoot: '{button \'OK\'}',
            },
            simple: {
              noRoot: '{button \'OK\'}',
            },
          },
        ],
      ],
      (targetSpec: {
        html: string,
      }&{
        [key in 'precise' | 'closestPrecise' | 'simple' | 'closestSimple']: {
          noRoot: (typeof Error) | string | null,
          withRoot?: (typeof Error) | string | null
        }
      }) => {
        beforeEach(async () => {
          await renderHtml(targetSpec.html);
        });
        pdescribe(
            '',
            [
              [
                'closestPreciseLocatorFor()',
                {
                  builderFn: closestPreciseLocatorFor,
                  lookupName: 'closestPrecise',
                },
              ],
              [
                'closestSimpleLocatorFor()',
                {
                  builderFn: closestSimpleLocatorFor,
                  lookupName: 'closestSimple',
                },
              ],
              [
                'preciseLocatorFor()',
                {
                  builderFn: preciseLocatorFor,
                  lookupName: 'precise',
                },
              ],
              [
                'simpleLocatorFor()',
                {
                  builderFn: simpleLocatorFor,
                  lookupName: 'simple',
                },
              ],
            ],
            ({builderFn, lookupName}: {
              builderFn: (e: WebElement, r?: WebElement) =>
                  webDriverPromise.Promise<string|null>,
              lookupName:
                  'closestPrecise' | 'closestSimple' | 'precise' | 'simple'
            }) => {
              const resultSpec = targetSpec[lookupName];
              pit('produces the correct locator',
                  [['without a root', 'noRoot'], ['with a root', 'withRoot']],
                  async (resultKey: 'noRoot'|'withRoot') => {
                    const expectedLocator = resultSpec[resultKey];
                    if (expectedLocator === undefined) {
                      expect(resultKey).toEqual('withRoot');
                      expect(lookupName).toEqual('simple');
                      return;
                    }

                    const target = driver.findElement(By.id('target'));
                    const root = resultKey === 'withRoot' ?
                        driver.findElement(By.id('root')) :
                        undefined;

                    const locatorBuilder = () =>
                        (root ? builderFn(target, root) : builderFn(target));

                    if (expectedLocator === Error) {
                      await expectAsync(locatorBuilder())
                          .toBeRejectedWithError();
                    } else {
                      await expectAsync(locatorBuilder())
                          .toBeResolvedTo(expectedLocator as string | null);
                    }
                  });
            });
      });

  async function renderHtml(html: string) {
    await driver.get('data:text/html;charset=utf-8,' + html);
  }
});


function pdescribe<T>(
    name: string, iterable: Iterable<[string, T]>, callback: (p: T) => void) {
  for (const [k, v] of iterable) {
    describe(`${name} ${k}`.trim(), () => {
      callback(v);
    });
  }
}

function pit<T>(
    name: string, iterable: Iterable<[string, T]>,
    callback: (p: T) => void|PromiseLike<void>) {
  for (const [k, v] of iterable) {
    it(`${name} ${k}`.trim(), () => callback(v));
  }
}
