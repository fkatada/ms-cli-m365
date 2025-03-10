import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import commands from '../../commands.js';
import { sinonUtil } from './../../../../utils/sinonUtil.js';
import command from './changelog-list.js';

describe(commands.CHANGELOG_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  const validVersions = 'beta,v1.0';
  const validChangeType = 'Addition';
  const validServices = 'Groups,Security';
  const validStartDate = '2018-12-01';
  const validEndDate = '2019-03-01';

  const validRSSResponse = `
    <rss version="2.0">
      <channel
        xmlns:atom="http://www.w3.org/2005/Atom">
        <title>Microsoft Graph Changelog</title>
        <link>https://graph.office.net/en-us/graph/changelog/rss</link>
        <description>Microsoft Graph Changelog Rss Feed</description>
        <lastBuildDate>Tue, 12 Jul 2022 09:58:42 Z</lastBuildDate>
        <atom:link href="https://graph.office.net/en-us/graph/changelog/rss/?search=&amp;filterBy=Financials" rel="self" type="application/rss+xml" />
        <item>
          <guid isPermaLink="false">7f1afeea-1c73-4e84-af08-8c9cd0fe27d5v1.0</guid>
          <category>prd</category>
          <category>v1.0</category>
          <title>Groups</title>
          <description>Added something.</description>
          <pubDate>2019-01-01T00:00:00.000Z</pubDate>
        </item>
        <item>
          <guid isPermaLink="false">7f1afeea-1c73-4e84-af08-8c9cd0fe27d5beta</guid>
          <category>prd</category>
          <category>beta</category>
          <title>Security</title>
          <description>Added _wellKnownName_ and _userConfigurations_ properties to the **mailFolder** entity.</description>
          <pubDate>2019-02-01T00:00:00.000Z</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const validChangelog = [
    {
      guid: '7f1afeea-1c73-4e84-af08-8c9cd0fe27d5beta',
      category: 'beta',
      title: 'Security',
      description: 'Added _wellKnownName_ and _userConfigurations_ properties to the **mailFolder** entity.',
      pubDate: new Date('2019-02-01T00:00:00.000Z')
    },
    {
      guid: '7f1afeea-1c73-4e84-af08-8c9cd0fe27d5v1.0',
      category: 'v1.0',
      title: 'Groups',
      description: 'Added something.',
      pubDate: new Date('2019-01-01T00:00:00.000Z')
    }
  ];

  const validChangelogText = [
    {
      guid: '7f1afeea-1c73-4e84-af08-8c9cd0fe27d5beta',
      category: 'beta',
      title: 'Security',
      description: 'Added wellKnownName and userConfigurations prop...',
      pubDate: new Date('2019-02-01T00:00:00.000Z')
    },
    {
      guid: '7f1afeea-1c73-4e84-af08-8c9cd0fe27d5v1.0',
      category: 'v1.0',
      title: 'Groups',
      description: 'Added something.',
      pubDate: new Date('2019-01-01T00:00:00.000Z')
    }
  ];

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');

    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([request.get]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.CHANGELOG_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['category', 'title', 'description']);
  });

  it('fails validation if versions contains an invalid value.', async () => {
    const actual = command.validate({
      options: {
        versions: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if changeType is an invalid value.', async () => {
    const actual = command.validate({
      options: {
        changeType: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if services contains an invalid value.', async () => {
    const actual = command.validate({
      options: {
        services: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if startDate is invalid ISO date.', async () => {
    const actual = command.validate({
      options: {
        startDate: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if endDate is invalid ISO date.', async () => {
    const actual = command.validate({
      options: {
        endDate: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if endDate is earlier than startDate.', async () => {
    const actual = command.validate({
      options: {
        endDate: '2018-11-01',
        startDate: '2018-12-01'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when valid versions specified', async () => {
    const actual = await command.validate({
      options: {
        versions: validVersions
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid changeType specified', async () => {
    const actual = await command.validate({
      options: {
        changeType: validChangeType
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid services specified', async () => {
    const actual = await command.validate({
      options: {
        services: validServices
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid startDate specified', async () => {
    const actual = await command.validate({
      options: {
        startDate: validStartDate
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid endDate specified', async () => {
    const actual = await command.validate({
      options: {
        endDate: validEndDate
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('retrieves changelog list', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://developer.microsoft.com/en-us/graph/changelog/rss') {
        return validRSSResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {}
    });
    assert(loggerLogSpy.calledWith(validChangelog));
  });

  it('retrieves changelog list as text', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://developer.microsoft.com/en-us/graph/changelog/rss') {
        return validRSSResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: { output: 'text' }
    });
    assert(loggerLogSpy.calledWith(validChangelogText));
  });

  it('retrieves changelog list based on changeType', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://developer.microsoft.com/en-us/graph/changelog/rss/?filterBy=Addition') {
        return validRSSResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        changeType: validChangeType
      }
    });
    assert(loggerLogSpy.calledWith(validChangelog));
  });

  it('retrieves changelog list based on versions, services, startDate and endDate', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://developer.microsoft.com/en-us/graph/changelog/rss') {
        return validRSSResponse;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        versions: validVersions,
        services: validServices,
        startDate: validStartDate,
        endDate: validEndDate
      }
    });
    assert(loggerLogSpy.calledWith(validChangelog));
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'get').rejects(new Error('An error has occurred'));

    await assert.rejects(command.action(logger, { options: {} } as any), new CommandError('An error has occurred'));
  });
});
