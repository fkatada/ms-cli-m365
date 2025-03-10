import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './serviceannouncement-healthissue-list.js';

describe(commands.SERVICEANNOUNCEMENT_HEALTHISSUE_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;

  const jsonOutput = {
    "value": [
      {
        "startDateTime": "2021-08-02T14:36:00Z",
        "endDateTime": "2021-08-06T20:25:00Z",
        "lastModifiedDateTime": "2021-08-06T20:28:36.537Z",
        "title": "Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.",
        "id": "CR275975",
        "impactDescription": "Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.",
        "classification": "advisory",
        "origin": "microsoft",
        "status": "serviceRestored",
        "service": "Dynamics 365 Apps",
        "feature": "Other",
        "featureGroup": "Other",
        "isResolved": true,
        "highImpact": null,
        "details": [],
        "posts": [
          {
            "createdDateTime": "2021-08-06T17:49:34.54Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.We are aware of an emerging issue in which a custom connector previously added to a DLP policy using PowerShell may be removed if the DLP policy is edited through the Power Platform Admin Center. We are investigating the issue and will provide another update within the next 30 minutes.This information is preliminary and may be subject to changes, corrections, and updates."
            }
          },
          {
            "createdDateTime": "2021-08-06T18:13:57.923Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.More Info:This only affects the legacy experience; DLP policies created through the Power Platform admin center are unaffected.To more easily manage custom connectors in your tenant-level DLP policy, you can now use the Custom Connector URL Patterns feature (currently in preview). Please <a href=\"https://docs.microsoft.com/en-us/power-platform/admin/dlp-custom-connector-parity\">review the following documentation.</a>You can verify whether your custom connector is still in the policy using PowerShell. Please see the following <a href=\"https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.administration.powershell/get-dlppolicy?view=pa-ps-latest\">documentation</a>.Current Status: We are currently examining service telemetry and recent service updates to determine the root cause of this issue.Incident Start Time: Monday, August 2, 2021, at 2:36 PM UTCNext Update: Friday, August 6, 2021, at 9:00 PM UTC, to allow time for additional investigation."
            }
          },
          {
            "createdDateTime": "2021-08-06T20:28:36.537Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.User Impact: Custom connector added to a DLP policy via PowerShell may be removed if policy is edited in Power Platform admin center.More Info:This only affects the unsupported legacy experience; DLP policies created through the Power Platform admin center are unaffected.To manage custom connectors in your tenant-level DLP policy, you can now use the Custom Connector URL Patterns feature (currently in preview). Please <a href=\"https://docs.microsoft.com/en-us/power-platform/admin/dlp-custom-connector-parity\">review the following documentation.</a>You can verify whether your custom connector is still in the policy using PowerShell. Please see the following <a href=\"https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.administration.powershell/get-dlppolicy?view=pa-ps-latest\">documentation</a>.Final Status: After our investigation, we have determined that this is a known bug that only occurs using the unsupported legacy PowerShell experience. The issue occurs when the following steps are performed:1. An admin opens the DLP policies page in the Power Platform Admin Center in a web browser.2. A custom connector is added to the policy using the \"Add-CustomConnectorToPolicy\" PowerShell cmdlet.3. Without refreshing the policy list, the admin then edits and saves the same policy in Power Platform Admin Center.4. The previously-added custom connector gets removed from the policy.We recommend avoiding the above process and perform DLP policy updates using the Power Platform admin center interface.As this rarely occurs in the above scenario using unsupported methods, we are treating this issue as a known bug that will be addressed in a future service update.Incident Start Time: Monday, August 2, 2021, at 2:36 PM UTCIncident End Time: Friday, August 6, 2021, at 8:25 PM UTCPreliminary Root Cause: A known bug that occurs when a custom connector is added to a DLP policy via legacy  PowerShell cmdlet and then edited using a cached version of the DLP policies page in the Power Platform Admin Center.Next Steps: We are developing a patch  to correct this issue to be included in a future service update.This is the final update on the incident."
            }
          }
        ]
      },
      {
        "startDateTime": "2021-11-17T13:00:00Z",
        "endDateTime": "2021-11-17T13:58:00Z",
        "lastModifiedDateTime": "2021-11-24T18:04:07.063Z",
        "title": "Users may have been unable to launch Microsoft Forms",
        "id": "FM298724",
        "impactDescription": "Users may have been unable to launch Microsoft Forms",
        "classification": "incident",
        "origin": "microsoft",
        "status": "postIncidentReviewPublished",
        "service": "Microsoft Forms",
        "feature": "Outage",
        "featureGroup": "Service",
        "isResolved": true,
        "highImpact": null,
        "details": [],
        "posts": [
          {
            "createdDateTime": "2021-11-17T13:32:11.507Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may be unable to launch Microsoft FormsUser Impact: Users may be unable to launch Microsoft FormsMore info: Users may receive the error 'This service is unavailable'.Current status: We're investigating a potential issue with Microsoft Forms and we're checking for impact to your organization. We'll provide an update within 30 minutes."
            }
          },
          {
            "createdDateTime": "2021-11-17T13:43:12.06Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may be unable to launch Microsoft FormsUser Impact: Users may be unable to launch Microsoft FormsMore info: Users may receive the error 'This service is unavailable'.Current status: We're reviewing diagnostic data to isolate the source of the issue.Scope of impact: This issue could potentially impact any user.Next update by: Wednesday, November 17, 2021, at 2:30 PM UTC"
            }
          },
          {
            "createdDateTime": "2021-11-17T14:15:34.897Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may have been unable to launch Microsoft FormsUser Impact: Users may have been unable to launch Microsoft FormsMore info: Users may have received the error 'This service was unavailable'.Final status: We've identified that an unexpected increase in user requests resulted in impact. We manually triggered scale-up activities, which paired with automated scaling mechanisms, remediated impact. We've monitored the service and confirmed that the issue is resolved.Scope of impact: This issue could have potentially impacted any user, however, telemetry indicated that users within Europe, Middle East, and Africa (EMEA) experienced the most significant impact.Start time: Wednesday, November 17, 2021, at 1:00 PM UTCEnd time: Wednesday, November 17, 2021, at 1:58 PM UTCRoot cause: An order of magnitude increase of requests from the Middle East region occurred within a very small period of time. This exceeded what the auto-scaling configuration, which our service relies on for reacting to traffic fluctuations, could handle. As our auto-scaling systems could not provision capacity at the pace required to keep up with the rate of traffic increase, requests could not be processed in a timely manner, which resulted in impact.Next steps:- For a more comprehensive list of next steps and actions, please refer to the Post Incident Review document.We'll publish a post-incident report within five business days."
            }
          },
          {
            "createdDateTime": "2021-11-19T15:58:37.487Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          },
          {
            "createdDateTime": "2021-11-24T18:01:53.493Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          },
          {
            "createdDateTime": "2021-11-24T18:04:07.063Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          }
        ]
      }
    ]
  };

  const jsonOutputMicrosoftForms = {
    "value": [
      {
        "startDateTime": "2021-11-17T13:00:00Z",
        "endDateTime": "2021-11-17T13:58:00Z",
        "lastModifiedDateTime": "2021-11-24T18:04:07.063Z",
        "title": "Users may have been unable to launch Microsoft Forms",
        "id": "FM298724",
        "impactDescription": "Users may have been unable to launch Microsoft Forms",
        "classification": "incident",
        "origin": "microsoft",
        "status": "postIncidentReviewPublished",
        "service": "Microsoft Forms",
        "feature": "Outage",
        "featureGroup": "Service",
        "isResolved": true,
        "highImpact": null,
        "details": [],
        "posts": [
          {
            "createdDateTime": "2021-11-17T13:32:11.507Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may be unable to launch Microsoft FormsUser Impact: Users may be unable to launch Microsoft FormsMore info: Users may receive the error 'This service is unavailable'.Current status: We're investigating a potential issue with Microsoft Forms and we're checking for impact to your organization. We'll provide an update within 30 minutes."
            }
          },
          {
            "createdDateTime": "2021-11-17T13:43:12.06Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may be unable to launch Microsoft FormsUser Impact: Users may be unable to launch Microsoft FormsMore info: Users may receive the error 'This service is unavailable'.Current status: We're reviewing diagnostic data to isolate the source of the issue.Scope of impact: This issue could potentially impact any user.Next update by: Wednesday, November 17, 2021, at 2:30 PM UTC"
            }
          },
          {
            "createdDateTime": "2021-11-17T14:15:34.897Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "Title: Users may have been unable to launch Microsoft FormsUser Impact: Users may have been unable to launch Microsoft FormsMore info: Users may have received the error 'This service was unavailable'.Final status: We've identified that an unexpected increase in user requests resulted in impact. We manually triggered scale-up activities, which paired with automated scaling mechanisms, remediated impact. We've monitored the service and confirmed that the issue is resolved.Scope of impact: This issue could have potentially impacted any user, however, telemetry indicated that users within Europe, Middle East, and Africa (EMEA) experienced the most significant impact.Start time: Wednesday, November 17, 2021, at 1:00 PM UTCEnd time: Wednesday, November 17, 2021, at 1:58 PM UTCRoot cause: An order of magnitude increase of requests from the Middle East region occurred within a very small period of time. This exceeded what the auto-scaling configuration, which our service relies on for reacting to traffic fluctuations, could handle. As our auto-scaling systems could not provision capacity at the pace required to keep up with the rate of traffic increase, requests could not be processed in a timely manner, which resulted in impact.Next steps:- For a more comprehensive list of next steps and actions, please refer to the Post Incident Review document.We'll publish a post-incident report within five business days."
            }
          },
          {
            "createdDateTime": "2021-11-19T15:58:37.487Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          },
          {
            "createdDateTime": "2021-11-24T18:01:53.493Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          },
          {
            "createdDateTime": "2021-11-24T18:04:07.063Z",
            "postType": "regular",
            "description": {
              "contentType": "html",
              "content": "A post-incident report has been published."
            }
          }
        ]
      }
    ]
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
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
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.SERVICEANNOUNCEMENT_HEALTHISSUE_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'title']);
  });

  it('handles promise error while getting service health issues available in Microsoft 365', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues') > -1) {
        throw 'An error has occurred';
      }
      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: {} } as any), new CommandError('An error has occurred'));
  });

  it('gets the service health issues available in Microsoft 365', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues') > -1) {
        return jsonOutput;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
      }
    });
    assert(loggerLogSpy.calledWith(jsonOutput.value));
  });

  it('gets the service health issues available in Microsoft 365 (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues') > -1) {
        return jsonOutput;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true
      }
    });
    assert(loggerLogSpy.calledWith(jsonOutput.value));
  });

  it('gets the service health issues for a particular service available in Microsoft 365', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues') > -1) {
        return jsonOutputMicrosoftForms;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        service: 'Microsoft Forms'
      }
    } as any);
    assert(loggerLogSpy.calledWith(jsonOutputMicrosoftForms.value));
  });

  it('gets the service health issues for a particular service available in Microsoft 365 as text', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/admin/serviceAnnouncement/issues') > -1) {
        return jsonOutputMicrosoftForms;
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        service: 'Microsoft Forms',
        output: 'text'
      }
    });
    assert(loggerLogSpy.calledWith(jsonOutputMicrosoftForms.value));
  });
});
