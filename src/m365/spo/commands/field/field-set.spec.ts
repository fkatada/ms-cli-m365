import assert from 'assert';
import Sinon, * as sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import { urlUtil } from '../../../../utils/urlUtil.js';
import commands from '../../commands.js';
import command from './field-set.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.FIELD_SET, () => {
  let log: any[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
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
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.FIELD_SET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('updates site column specified by title', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn', Description: 'My column' } });
    assert(loggerLogSpy.notCalled);
  });

  it('updates site column specified by internalName', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', internalName: 'MyColumn', Description: 'My column' } });
    assert(loggerLogSpy.notCalled);
  });

  it('updates site column specified by id, pushing the changes to existing lists', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetById"><Parameters><Parameter Type="Guid">5d021339-4d62-4fe9-9d2a-c99bc56a157a</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My cool column</Parameter></SetProperty><SetProperty Id="668" ObjectPathId="663" Name="Title"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">true</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', id: '5d021339-4d62-4fe9-9d2a-c99bc56a157a', Description: 'My cool column', Title: 'My column', updateExistingLists: true } });
  });

  it('updates list column specified by id, list specified by id', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetById"><Parameters><Parameter Type="Guid">03cef05c-ba50-4dcf-a876-304f0626085c</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetById"><Parameters><Parameter Type="Guid">5d021339-4d62-4fe9-9d2a-c99bc56a157a</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', listId: '03cef05c-ba50-4dcf-a876-304f0626085c', id: '5d021339-4d62-4fe9-9d2a-c99bc56a157a', Description: 'My column' } });
    assert(loggerLogSpy.notCalled);
  });

  it('updates list column specified by title, list specified by title', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByTitle"><Parameters><Parameter Type="String">My List</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List', title: 'MyColumn', Description: 'My column' } });
  });

  it('updates list column specified by internalName, list specified by title', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByTitle"><Parameters><Parameter Type="String">My List</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List', internalName: 'MyColumn', Description: 'My column' } });
  });

  it('updates list column specified by name, list specified by url', async () => {
    const webUrl = 'https://contoso.sharepoint.com';
    const listUrl = '/lists/TestList';
    const listServerRelativeUrl: string = urlUtil.getServerRelativePath(webUrl, listUrl);
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="2" ObjectPathId="1" /><ObjectPath Id="4" ObjectPathId="3" /><ObjectPath Id="6" ObjectPathId="5" /><Query Id="7" ObjectPathId="5"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticProperty Id="1" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /><Property Id="3" ParentId="1" Name="Web" /><Method Id="5" ParentId="3" Name="GetList"><Parameters><Parameter Type="String">${listServerRelativeUrl}</Parameter></Parameters></Method></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column Description</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: webUrl, listUrl: listUrl, title: 'MyColumn', Description: 'My column Description' } });
  });

  it('updates list column specified by internalName, list specified by url', async () => {
    const webUrl = 'https://contoso.sharepoint.com';
    const listUrl = '/lists/TestList';
    const listServerRelativeUrl: string = urlUtil.getServerRelativePath(webUrl, listUrl);
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="2" ObjectPathId="1" /><ObjectPath Id="4" ObjectPathId="3" /><ObjectPath Id="6" ObjectPathId="5" /><Query Id="7" ObjectPathId="5"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><StaticProperty Id="1" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /><Property Id="3" ParentId="1" Name="Web" /><Method Id="5" ParentId="3" Name="GetList"><Parameters><Parameter Type="String">${listServerRelativeUrl}</Parameter></Parameters></Method></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column Description</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: webUrl, listUrl: listUrl, internalName: 'MyColumn', Description: 'My column Description' } });
  });

  it('correctly escapes XML in list title', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByTitle"><Parameters><Parameter Type="String">My List&gt;</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List>', title: 'MyColumn', Description: 'My column' } });
  });

  it('ignores global options when creating request data', async () => {
    const postStub: Sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByTitle"><Parameters><Parameter Type="String">My List&gt;</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "270fa19e-f0f7-0000-37ae-1733ad1b6703"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.List",
            "_ObjectIdentity_": "270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c",
            "_ObjectVersion_": "6"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Identity Id="5" Name="270fa19e-f0f7-0000-37ae-1733ad1b6703|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, verbose: true, output: "text", webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List>', title: 'MyColumn', Description: 'My column' } });
    assert.strictEqual(postStub.thirdCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="fe0ea19e-7022-0000-37ae-1357e77e046c|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:list:03cef05c-ba50-4dcf-a876-304f0626085c:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`);
  });

  it('correctly escapes XML in field title', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'abc') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn&gt;</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn>', Description: 'My column' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('correctly escapes XML in field internalName', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'abc') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn&gt;</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', internalName: 'MyColumn>', Description: 'My column' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('correctly escapes XML in field properties', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'abc') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column&gt;</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([
            {
              "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8231.1213", "ErrorInfo": null, "TraceCorrelationId": "b909a19e-5020-0000-37ae-17f800b4ea4c"
            }
          ]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn', Description: 'My column>' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('correctly handles an error when the field specified by id doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetById"><Parameters><Parameter Type="Guid">5d021339-4d62-4fe9-9d2a-c99bc56a157a</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "Invalid field name. {5d021339-4d62-4fe9-9d2a-c99bc56a157a} https:\u002f\u002fcontoso.sharepoint.com ",
              "ErrorValue": null,
              "TraceCorrelationId": "530fa19e-00d0-0000-3292-ba86430ff44a",
              "ErrorCode": -2147024809,
              "ErrorTypeName": "System.ArgumentException"
            },
            "TraceCorrelationId": "530fa19e-00d0-0000-3292-ba86430ff44a"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', id: '5d021339-4d62-4fe9-9d2a-c99bc56a157a', Description: 'My cool column', Title: 'My column', updateExistingLists: true } } as any),
      new CommandError(`Invalid field name. {5d021339-4d62-4fe9-9d2a-c99bc56a157a} https:\u002f\u002fcontoso.sharepoint.com `));
  });

  it('correctly handles an error when the field specified by title doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "Column 'MyColumn' does not exist. It may have been deleted by another user.",
              "ErrorValue": null,
              "TraceCorrelationId": "4c0fa19e-b007-0000-37ae-1d177693b378",
              "ErrorCode": -2147024809,
              "ErrorTypeName": "System.ArgumentException"
            },
            "TraceCorrelationId": "4c0fa19e-b007-0000-37ae-1d177693b378"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn', Description: 'My column' } } as any),
      new CommandError(`Column 'MyColumn' does not exist. It may have been deleted by another user.`));
  });

  it('correctly handles an error when the field specified by internalName doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "Column 'MyColumn' does not exist. It may have been deleted by another user.",
              "ErrorValue": null,
              "TraceCorrelationId": "4c0fa19e-b007-0000-37ae-1d177693b378",
              "ErrorCode": -2147024809,
              "ErrorTypeName": "System.ArgumentException"
            },
            "TraceCorrelationId": "4c0fa19e-b007-0000-37ae-1d177693b378"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', internalName: 'MyColumn', Description: 'My column' } } as any),
      new CommandError(`Column 'MyColumn' does not exist. It may have been deleted by another user.`));
  });

  it('correctly handles an error when the list specified by id doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetById"><Parameters><Parameter Type="Guid">03cef05c-ba50-4dcf-a876-304f0626085c</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "List does not exist.\n\nThe page you selected contains a list that does not exist.  It may have been deleted by another user.",
              "ErrorValue": null,
              "TraceCorrelationId": "410fa19e-305f-0000-37ae-11555afd8e8a",
              "ErrorCode": -2130575322,
              "ErrorTypeName": "Microsoft.SharePoint.SPException"
            },
            "TraceCorrelationId": "410fa19e-305f-0000-37ae-11555afd8e8a"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', listId: '03cef05c-ba50-4dcf-a876-304f0626085c', id: '5d021339-4d62-4fe9-9d2a-c99bc56a157a', Description: 'My column' } } as any),
      new CommandError(`List does not exist.\n\nThe page you selected contains a list that does not exist.  It may have been deleted by another user.`));
  });

  it('correctly handles an error when the list specified by title doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByTitle"><Parameters><Parameter Type="String">My List</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Lists" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "List 'My List' does not exist at site with URL 'https:\u002f\u002fcontoso.sharepoint.com'.",
              "ErrorValue": null,
              "TraceCorrelationId": "380fa19e-e03c-0000-3292-b95a2fa0f656",
              "ErrorCode": -1,
              "ErrorTypeName": "System.ArgumentException"
            },
            "TraceCorrelationId": "380fa19e-e03c-0000-3292-b95a2fa0f656"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List', title: 'MyColumn', Description: 'My column' } } as any),
      new CommandError(`List 'My List' does not exist at site with URL 'https:\u002f\u002fcontoso.sharepoint.com'.`));
  });

  it('correctly handles an error when updating the field failed', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_vti_bin/client.svc/ProcessQuery') {
        if (opts.headers &&
          opts.headers['X-RequestDigest'] !== 'ABC') {
          throw 'Invalid request';
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="664" ObjectPathId="663" /><Query Id="665" ObjectPathId="663"><Query SelectAllProperties="false"><Properties /></Query></Query></Actions><ObjectPaths><Method Id="663" ParentId="7" Name="GetByInternalNameOrTitle"><Parameters><Parameter Type="String">MyColumn</Parameter></Parameters></Method><Property Id="7" ParentId="5" Name="Fields" /><Property Id="5" ParentId="3" Name="Web" /><StaticProperty Id="3" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": null,
            "TraceCorrelationId": "7c0aa19e-1058-0000-37ae-14170affbedb"
          }, 664, {
            "IsNull": false
          }, 665, {
            "_ObjectType_": "SP.FieldText",
            "_ObjectIdentity_": "7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a"
          }]);
        }

        if (opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><SetProperty Id="667" ObjectPathId="663" Name="Description"><Parameter Type="String">My column</Parameter></SetProperty><Method Name="UpdateAndPushChanges" Id="9000" ObjectPathId="663"><Parameters><Parameter Type="Boolean">false</Parameter></Parameters></Method></Actions><ObjectPaths><Identity Id="663" Name="7c0aa19e-1058-0000-37ae-14170affbedb|740c6a0b-85e2-48a0-a494-e0f1759d4aa7:site:ff7a8065-9120-4c0a-982a-163ab9014179:web:e781d3dc-238d-44f7-8724-5e3e9eabcd6e:field:5d021339-4d62-4fe9-9d2a-c99bc56a157a" /></ObjectPaths></Request>`) {
          return JSON.stringify([{
            "SchemaVersion": "15.0.0.0",
            "LibraryVersion": "16.0.8231.1213",
            "ErrorInfo": {
              "ErrorMessage": "An error has occurred",
              "ErrorValue": null,
              "TraceCorrelationId": "380fa19e-e03c-0000-3292-b95a2fa0f656",
              "ErrorCode": -1,
              "ErrorTypeName": "System.ArgumentException"
            },
            "TraceCorrelationId": "380fa19e-e03c-0000-3292-b95a2fa0f656"
          }]);
        }
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn', Description: 'My column' } } as any),
      new CommandError(`An error has occurred`));
  });

  it('allows unknown options', () => {
    const allowUnknownOptions = command.allowUnknownOptions();
    assert.strictEqual(allowUnknownOptions, true);
  });

  it('fails validation if webUrl is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'invalid', listId: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', title: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if either id, title, or internalName are not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both id and title are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', title: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both id and internalName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', internalName: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if both title and internalName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', title: 'MyColumn', internalName: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id, title and internalName are specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', title: 'MyColumn', internalName: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id is specified and is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listId, listTitle and listUrl are specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', listTitle: 'My List', listUrl: '/lists/testlist', title: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listId is specified and is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: 'invalid', title: 'MyColumn' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when webUrl and id are specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: '330f29c5-5c4c-465f-9f4b-7903020ae1ce' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when webUrl, listId and title are specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', title: 'MyColumn' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when webUrl, listId and internalName are specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '330f29c5-5c4c-465f-9f4b-7903020ae1ce', internalName: 'MyColumn' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when webUrl, listTitle and id are specified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'My List', id: '330f29c5-5c4c-465f-9f4b-7903020ae1ce' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
