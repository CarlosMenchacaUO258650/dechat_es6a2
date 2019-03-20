const N3 = require('n3');
const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../namespaces');
const uniqid = require('uniqid');
const winston = require('winston');
const URI = require('uri-js');
const auth = require('solid-auth-client');
const {
    format
} = require('date-fns');
const rdfjsSourceFromUrl = require('../Repositories/rdfjssourcefactory').fromUrl;
const SemanticChat = require('../semanticchat');
const Group = require('../Group');
const BaseService = require('./BaseService');
const Uploader = require('../Repositories/SolidUploaderRepository');

let uploader = new Uploader(auth.fetch);

let baseService = new BaseService(auth.fetch);

class CreateService {
    constructor(fetch) {
        this.fetch = fetch;
        this.logger = winston.createLogger({
            level: 'error',
            transports: [
                new winston.transports.Console(),
            ],
            format: winston.format.cli()
        });
    }

    /**
     * This method creates a new chat
     */
    async setUpNewChat(userDataUrl, userWebId, interlocutorWebId) {
        const chatUrl = await baseService.generateUniqueUrlForResource(userDataUrl);
        const semanticChat = new SemanticChat({
            url: chatUrl,
            messageBaseUrl: userDataUrl,
            userWebId,
            interlocutorWebId
        });

        var ids = [];
        ids.push(interlocutorWebId);

        setUpNew(chatUrl, userDataUrl, userWebId, ids, semanticChat, ids[0]);

        return semanticChat;
    }

    async setUpNewGroup(userDataUrl, userWebId, interlocutorWebIds, friendName) {

        const chatUrl = await baseService.generateUniqueUrlForResource(userDataUrl);
        const group = new Group({
            url: chatUrl,
            messageBaseUrl: userDataUrl,
            userWebId,
            members: interlocutorWebIds,
			interlocutorName: friendName,
			photo: "main/resources/static/img/group.png"
        });

        await this.setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, group, userWebId.split("card")[0] + "Group/" + friendName;

        return group;
    }

    async setUpNew(chatUrl, userDataUrl, userWebId, interlocutorWebIds, semanticChat, firstId) {
		
		try {
                    await uploader.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> <${userWebId}>;
			<${namespaces.schema}recipient> <${firstId}>;
			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
                } catch (e) {
					console.log("NO-A");
                    this.logger.error(`Could not add chat to WebId.`);
                    this.logger.error(e);
                }

        interlocutorWebIds.forEach(async interlocutorWebId => {
				console.log("Registrando: " + interlocutorWebId);
                const invitation = await this.generateInvitation(userDataUrl.replace("/private/", "/public/"), semanticChat.getUrl(), userWebId, interlocutorWebId);
                const invitation2 = await this.generateInvitation(userDataUrl, semanticChat.getUrl(), userWebId, interlocutorWebId);

                try {
                    await uploader.executeSPARQLUpdateForUser(userDataUrl.replace("/private/", "/public/"), `INSERT DATA {${invitation.sparqlUpdate}}`);

                    await uploader.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${invitation2.sparqlUpdate}}`);
                } catch (e) {
					console.log("NO-B");
                    this.logger.error(`Could not save invitation for chat.`);
                    this.logger.error(e);
                }

                try {
                    await uploader.sendToInterlocutorInbox(await baseService.getInboxUrl(interlocutorWebId), invitation.notification);
                } catch (e) {
                    this.logger.error(`Could not send invitation to interlocutor.`);
                    this.logger.error(e);
                }
            });
        }

        async generateInvitation(baseUrl, chatUrl, userWebId, interlocutorWebId) {
            const invitationUrl = await baseService.generateUniqueUrlForResource(baseUrl);
            //console.log(invitationUrl);
            const notification = `<${invitationUrl}> a <${namespaces.schema}InviteAction>.`;
            const sparqlUpdate = `
    <${invitationUrl}> a <${namespaces.schema}InviteAction>;
      <${namespaces.schema}event> <${chatUrl}>;
      <${namespaces.schema}agent> <${userWebId}>;
      <${namespaces.schema}recipient> <${interlocutorWebId}>.
  `;

            return {
                notification,
                sparqlUpdate
            };
        }


    }
    module.exports = CreateService;