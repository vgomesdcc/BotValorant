// import { Client, Collection, GuildMember, Message, MessageReaction, PartialMessageReaction, PartialUser, Role, TextChannel, User } from "discord.js";
// import { Discord, On, Slash, SlashOption } from "discordx";
// import type { ArgsOf } from "discordx";
// import emojiRegex from "emoji-regex";
// import Sequelize from 'sequelize';
// import fs from 'fs';
// import { Category } from "@discordx/utilities";
// import { channelsConfig } from "../global/global.js";

// @Discord()
// @Category("Role Commands")
// export abstract class RoleReactionHandler {
//     // @Slash("add-role")
//     // add(@SlashOption("user") user: User): void {
//     // }

//     static firstMessage: Message;
//     static role: Sequelize.ModelStatic<Sequelize.Model<any, any>>;
//     static c_add = "\n\n`!role add emoji RoleName`";
//     static c_delete = "\n\n`!role delete emoji removeFromUsers`";

//     static message = `
// Aqui dentro do servidor estão disponíveis canais específicios, referentes a cada área.
    
// Para ter acesso a esses canais, basta reagir a esta mensagem de acordo com a área escolhida. E claro, você pode reagir a mais de uma, se quiser.
    
// **Áreas disponíveis:**
// `;

//     @On("ready")
//     async onReady([client]: ArgsOf<"ready">) {
//         await RoleReactionHandler._addDb();
//         try {
//             const channel = await client.channels.fetch(channelsConfig.bot) as TextChannel;
//             if (channel) {
//                 var messages = await channel.messages.fetch() as Collection<string, Message<boolean>>;
//                 messages = await RoleReactionHandler._generateFirstMessage(channel, messages);
//                 await RoleReactionHandler._updateFirstMessage();
//                 await RoleReactionHandler._updateMessageReactions(client);
//                 console.log(`Blu Roles - Watching for reactions...`)
//             } else {
//                 console.log(`Blu Roles - Channel not found`)
//             }
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     @On("messageCreate")
//     async onMessageCreate([message]: ArgsOf<"messageCreate">) {
//         if (message.channel.id == channelsConfig.bot && !message.author.bot) {
//             // await message.delete();
//             return;
//         }
//         try {
//             await RoleReactionHandler._checkCommands(message);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     @On("messageReactionAdd")
//     async onMessageReactionAdd([reaction, user]: ArgsOf<"messageReactionAdd">, client: Client) {
//         try {
//             if (user.bot || reaction.message.id !== RoleReactionHandler.firstMessage.id) return;
//             var dbRoles = await RoleReactionHandler._getDbRoles();
//             var role = dbRoles.find(r => r.get("emoji") == reaction.emoji.name);
//             if (!role) {
//                 await reaction.remove();
//                 return;
//             }
//             await RoleReactionHandler._addRoleToUser(client, reaction, user);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     @On("messageReactionRemove")
//     async onMessageReactionRemove([reaction, user]: ArgsOf<"messageReactionRemove">, client: Client) {
//         if (user.bot || reaction.message.id !== RoleReactionHandler.firstMessage.id) return;
//         try {
//             await RoleReactionHandler._removeRoleFromUser(client, reaction, user);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     static async _updateMessageReactions(client: Client) {
//         var channel = await client.channels.fetch(channelsConfig.bot) as TextChannel;
//         var messages = await channel.messages.fetch();
//         RoleReactionHandler.firstMessage = messages.last()!;
//         var dbRoles = await RoleReactionHandler._getDbRoles();

//         /// Add correct emojis
//         var reactions = RoleReactionHandler.firstMessage!.reactions.cache;
//         for (const role of dbRoles) {
//             var emoji = role.get("emoji") as string;
//             var reaction = reactions.find(r => r.emoji.name == emoji);
//             if (!reaction) {
//                 await RoleReactionHandler.firstMessage!.react(emoji);
//             }
//         }

//         /// Remove emojis that are not in the database
//         for (const reaction of reactions.values()) {
//             var emojiName = reaction.emoji.name;
//             if (!dbRoles.find(r => r.get("emoji") == emojiName)) {
//                 await reaction.remove();
//             }
//         }
//         await RoleReactionHandler._updateFirstMessage();
//     }

//     static async _getBotMessage() {
//         let rolesResult = (await RoleReactionHandler._listAllRolesAsString()) ?? "";
//         return RoleReactionHandler.message + "\n" + rolesResult + "\n";
//     }

//     static async _updateFirstMessage() {
//         await RoleReactionHandler.firstMessage!.edit(await RoleReactionHandler._getBotMessage());
//     }

//     static async _checkCommands(message: Message<boolean>) {
//         if (message.author.bot) return;
//         if (message.content.startsWith("!")) {
//             let c_list = "\n\n`!role list`";
//             let help = RoleReactionHandler.c_add + c_list + RoleReactionHandler.c_delete;
//             let args = message.content.replace(/\s+/g, " ").split(' ');
//             let command = args[0];
//             try {
//                 if (command == '!role') {
//                     let type = args[1];
//                     if (type == 'list') {
//                         await RoleReactionHandler._listAllRoles(message);
//                     } else if (type == 'delete') {
//                         RoleReactionHandler._checkAdmin(message);
//                         await RoleReactionHandler._deleteRole(args, message);
//                     } else if (type == 'add') {
//                         RoleReactionHandler._checkAdmin(message);
//                         await RoleReactionHandler._addRole(args, message);
//                     } else if (type == 'help') {
//                         message.reply(help);
//                     } else {
//                         throw new Error('Comando inválido!' + help);
//                     }
//                 }
//             } catch (error) {
//                 message.reply((error as Error).message);
//             }
//         }
//     }

//     static _checkAdmin(message: Message<boolean>) {
//         if (!message.member?.permissions.has("Administrator")) {
//             throw new Error("Você não tem permissão para executar esse comando!");
//         }
//     }

//     static async _listAllRoles(message: Message) {
//         var result = await RoleReactionHandler._listAllRolesAsString();
//         if (result) {
//             //No futuro a mensagem com o nome da role ter a mesma cor da role
//             await message.reply(result);
//         } else {
//             await message.reply("Não há nenhum cargo cadastrado!");
//         }
//     }

//     static async _listAllRolesAsString() {
//         var roles = await RoleReactionHandler.role.findAll();
//         if (roles.length == 0) {
//             return null;
//         }
//         return roles.map(r => `${r.get("emoji")} - ${r.get("name")}`).join('\n');
//     }

//     static async _deleteRole(args: string[], message: Message) {
//         if (args.length < 4) {
//             throw new Error('Comando inválido!' + RoleReactionHandler.c_delete);
//         }
//         var emoji = args[2];
//         RoleReactionHandler._validateEmoji(emoji);
//         var role = await RoleReactionHandler.role.findOne({ where: { emoji: args[2] } });
//         if (!role) throw new Error('Cargo não encontrada!');
//         if (args[3] != 'true' && args[3] != 'false') throw new Error(`removeFromUsers inválido! Ex: \`!role delete ${emoji} true\``);
//         var removeFromUsers = args[3] == 'true';
//         var roleName = role.get("name") as string;
//         if (removeFromUsers) {
//             await RoleReactionHandler._removeRoleFromAllUsers(message.client, roleName);
//             await message.reply("Removido o emoji " + emoji + " e removida o cargo \"" + roleName + "\" de todos os usuários!");
//         } else {
//             await message.reply("Removido o emoji " + emoji + "!");
//         }
//         await role.destroy();
//         await RoleReactionHandler._updateMessageReactions(message.client);
//     }

//     static async _removeRoleFromAllUsers(client: Client, roleName: string) {
//         var role = await RoleReactionHandler._getServerRoleByName(client, roleName);
//         if (!role) return;
//         var users = await RoleReactionHandler._getServerUsers(client);
//         for (const user of users) {
//             await user.roles.remove(role);
//         }
//     }

//     static async _addRole(args: string[], message: Message) {
//         if (args.length < 4) throw new Error('Comando inválido!' + RoleReactionHandler.c_add);
//         var emoji = args[2];
//         RoleReactionHandler._validateEmoji(emoji);
//         var roleName = "";
//         for (let i = 3; i < args.length; i++) {
//             const element = args[i];
//             if (i == args.length - 1) {
//                 roleName += element;
//             } else {
//                 roleName += element + " ";
//             }
//         }
//         let role = await RoleReactionHandler._getServerRoleByName(message.client, roleName);
//         if (!role) {
//             throw new Error('O cargo não existe no servidor!');
//         } else {
//             let emojiInDb = await RoleReactionHandler.role.findOne({ where: { emoji: emoji } });
//             let roleInDb = await RoleReactionHandler.role.findOne({ where: { name: roleName } });
//             if (roleInDb) throw new Error('Cargo já cadastrado!');
//             if (emojiInDb) {
//                 emojiInDb.set("name", roleName);
//                 await emojiInDb.save();
//                 message.reply('O cargo foi atualizado!');
//             } else {
//                 await RoleReactionHandler.role.create({
//                     "emoji": emoji,
//                     "name": roleName
//                 });
//                 message.reply('O cargo foi criado!');
//             }
//             await RoleReactionHandler._updateMessageReactions(message.client);
//         }
//     }

//     static _validateEmoji(emoji: string) {
//         if ((emojiRegex().exec(emoji)?.length ?? 0) != 1) {
//             throw new Error('Emoji inválido!');
//         }
//     }

//     static async _addRoleToUser(client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
//         await RoleReactionHandler._getUserMemberAndRole(async (member, role) => {
//             try {
//                 await member?.roles?.add(role.id);
//                 console.log(`${user.username} added role ${reaction.emoji} ${role.name}`);
//             } catch (err) {
//                 console.error('Error adding role', err);
//             }
//         }, client, reaction, user);
//     }

//     static async _removeRoleFromUser(client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
//         // var userReactions = [] as MessageReaction[];
//         // var message = await RoleReactionHandler.firstMessage.fetch();
//         // message.reactions.cache.forEach(async (r) => {
//         //     if (r.emoji.name != reaction.emoji.name) {
//         //         var users = await r.users.fetch();
//         //         var hasThis = users.find((x) => x.id === user.id);
//         //         if (hasThis) {
//         //             userReactions.push(r);
//         //         }
//         //     }
//         // });
//         // var dbRoles = await RoleReactionHandler._getDbRoles();
//         await RoleReactionHandler._getUserMemberAndRole(async (member, role) => {
//             // for (const userReaction of userReactions) {
//             //     var dbRole = dbRoles.find((x) => x.get("emoji") === userReaction.emoji.name);
//             //     if (dbRole) {
//             //         console.log('has ReactionWithSameRole');
//             //         return;
//             //     }
//             // }
//             // console.log('has not ReactionWithSameRole');
//             try {
//                 await member?.roles?.remove(role.id);
//                 console.log(`${user.username} removed role ${reaction.emoji} ${role.name}`);
//             } catch (err) {
//                 console.error('Error removing role', err);
//             }

//         }, client, reaction, user);
//     }

//     static async _getUserMemberAndRole(callback: (member: GuildMember, role: Role) => void, client: Client, { message, emoji }: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
//         let member = await message.guild?.members.fetch({ user: user.id });
//         if (!member) return;
//         if (!emoji.name) return;
//         var dbRole = (await RoleReactionHandler._getDbRoles()).find(r => r.get("emoji") == emoji.name);
//         if (!dbRole) return;
//         var role = await RoleReactionHandler._getServerRoleByName(client, dbRole.get("name") as string);
//         if (!role) return;
//         callback(member, role);
//     }

//     static async _generateFirstMessage(channel: TextChannel, messages: Collection<string, Message<boolean>>) {
//         if (messages.size == 0) {
//             await channel.send(RoleReactionHandler.message);
//             var newMessages = await channel.messages.fetch();
//             RoleReactionHandler.firstMessage = newMessages.last()!;
//             return newMessages;
//         }
//         RoleReactionHandler.firstMessage = messages.last()!;
//         return messages;
//     }

//     static async _getDbRoles() {
//         return await RoleReactionHandler.role.findAll();
//     }

//     static async _getServerRoleByName(client: Client, name: string) {
//         let allRoles = await RoleReactionHandler._getServerRoles(client);
//         return allRoles.find(r => r.name == name) as Role | undefined;
//     }

//     static async _getServerRoles(client: Client) {
//         return Array.from((await client.guilds.cache.first()?.roles.fetch())?.values() ?? []);
//     }

//     static async _getServerUsers(client: Client) {
//         let users = (await client.guilds.cache.first()?.members.fetch());
//         let allUsers = Array.from(users?.values() ?? []);
//         return allUsers;
//     }

//     static async _addDb() {
//         try {
//             RoleReactionHandler.role = sequelize.define('role', {
//                 name: {
//                     type: Sequelize.STRING,
//                     allowNull: false,
//                 },
//                 emoji: {
//                     type: Sequelize.STRING,
//                     primaryKey: true,
//                     allowNull: false,
//                     unique: true,
//                 },
//             });
//             await RoleReactionHandler.role.sync();
//             console.log("Role table created");
//         } catch (error) {
//             console.log(error);
//         }
//     }
// }

// const sequelize = new Sequelize.Sequelize('database', 'bluappsdiscordbotlogin', 'bluappsdiscordbotpassword', {
//     host: 'localhost',
//     dialect: 'sqlite',
//     logging: false,
//     storage: 'database.sqlite',
// });
