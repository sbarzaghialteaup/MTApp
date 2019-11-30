DOCUMENTATION:
-------------
https://blogs.sap.com/2018/12/11/programming-applications-in-sap-cloud-platform/comment-page-1/#comment-482944

CLI:
---

cf api
cf login
cf target
cf services
cf apps
cf mtas

cf app MTAppBackend (to see routes)
cf env MTAppBackend (to see VCAP_SERVICES.xsuaa.credentials.xsappname)

cf create-service saas-registry application MTAppRegistry -c registry-config.json
cf update-service MTAppRegistry -c registry-config.json
cf bind-service MTAppBackend MTAppRegistry
cf restage MTAppBackend

cf routes
cf map-route MTAppRouter cfapps.eu10.hana.ondemand.com --hostname <subdomain>-trial-dev-mtapprouter
cf delete-route cfapps.eu10.hana.ondemand.com --hostname <subdomain>-trial-dev-mtapprouter -f

DELETE EVERYTHING IN SPACE BEFORE THIS DELETE UNSUBCRIBE ALL THE SUBSCRIBED CUSTOMER SUBACCOUNTS OTHERWISE THE
SAAS SERVICE CANNOT BE DELETED ANYMORE!!!
--------------------------------------------------------------------------------------------------------------
date && cf delete master_db_v0 -f && cf delete client_db_v0 -f && cf delete MTAppBackend -f && cf delete MTAppRouter -f
date && cf delete-service -f CLIENT_V0 && cf delete-service -f MASTER_V0 && cf delete-service MTAppUAA -f
date && cf delete-route cfapps.eu10.hana.ondemand.com --hostname prov-multi-be-qas-mtappbackend -f && cf delete-route cfapps.eu10.hana.ondemand.com --hostname prov-multi-be-qas-mtapprouter -f

BUILD AND DEPLOY MTA:
----------
date && mtb build && date
date && cf deploy mta_archives/MTApp_0.0.2.mtar -e deploy_to_qa.mtaext && date

ADD A SINGLE CUSTOMERB:
----------------------

cf create-service hanatrial hdi-shared CUSTOMERB_V0 -t subdomain:'customerb' -c '{ "schema": "customerb_V0_DEV" }'
cf bind-service client_db_v0 CUSTOMERB_V0
cf set-env CLIENT_DB_V0 TARGET_CONTAINER 'CUSTOMERB_V0'
cf start CLIENT_DB_V0
cf stop CLIENT_DB_V0
cf unbind-service client_db_v0 CUSTOMERB_V0
cf bind-service MTAppBackend CUSTOMERB_V0
cf map-route MTAppRouter cfapps.eu10.hana.ondemand.com --hostname customerb-dev-mtapprouter
cf restage MTAppBackend

REST API:
--------

cf env MTAppBackend (to see VCAP_SERVICES.saas-registry.credentials: url (for auth), saas_registry_url, clientid, clientsecret)

authentication:
POST /oauth/token?grant_type=client_credentials&response_type=token
tests: pm.environment.set("token", "Bearer " + JSON.parse(responseBody).access_token);

view app subscribers:
GET /api/v2.0/subscription

onboarding/subscribe:
PUT /api/v2.0/subscription/tenants/<subaccountid>?jobUuid=<guid> (content-type: application/json, body: {"subdomain":"<subdomain>"})
GET /api/v2.0/jobs/<jobid>

offboarding/unsubscribe:
DELETE /api/v2.0/subscription/tenants/<tenantid>?jobUuid=<guid>
GET /api/v2.0/jobs/<jobid>


Uninstall:
---------

offboard all tenants first!
cf services
cf apps
cf mtas
cf service MTAppRegistry
cf unbind-service MTAppBackend MTAppRegistry
cf delete-service MTAppRegistry -f
cf undeploy MTApp --delete-services -f

HTML5:
-----

cf create-service html5-apps-repo app-host test -c '{ "sizeLimit" : 1}'
cf html5-push -n html5-repo
cf html5-list -a MTAppRouter -u

PORTALE:
--------

cf push launchpad-deployer --health-check-type none