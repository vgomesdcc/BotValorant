import discord
from discord.ext import commands
import asyncio
import logging
from datetime import datetime

# Configuração do logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('discord')

# Definir intents
intents = discord.Intents.default()
intents.messages = True
intents.reactions = True
intents.guilds = True
intents.members = True

# Prefixo para comandos
bot = commands.Bot(command_prefix='!', intents=intents)

# Evento on_ready
@bot.event
async def on_ready():
    logger.info(f'Logged in as {bot.user}!')
    logger.info('Lista de comandos disponíveis:')
    for command in bot.commands:
        logger.info(f' - {command.name}')

# Evento on_message
@bot.event
async def on_message(message):
    logger.debug(f'Mensagem recebida: {message.content} de {message.author}')
    if message.author == bot.user:
        return
    await bot.process_commands(message)

# Evento on_command_error
@bot.event
async def on_command_error(ctx, error):
    logger.error(f'Erro ao processar o comando {ctx.command}: {error}')
    await ctx.send(f'Ocorreu um erro ao processar o comando: {error}')

# Comando para criar um evento
@bot.command(name='criar_evento')
async def criar_evento(ctx, data_hora: str, *roles: discord.Role):
    """
    Comando para criar um evento no formato !criar_evento 'YYYY-MM-DD HH:MM' @role1 @role2
    """
    try:
        event_time = datetime.strptime(data_hora, '%Y-%m-%d %H:%M')
        current_time = datetime.utcnow()
        if event_time < current_time:
            raise ValueError("A data e hora não podem estar no passado.")
    except ValueError:
        await ctx.send("Por favor, use o formato correto para data e hora: YYYY-MM-DD HH:MM")
        return

    mention_text = " ".join(role.mention for role in roles)
    embed = discord.Embed(
        title="Novo Evento Criado!",
        description=f"Evento marcado para {data_hora}. Reaja para confirmar sua presença!",
        color=discord.Color.blue()
    )
    message = await ctx.send(content=mention_text, embed=embed)
    await message.add_reaction("✅")
    await message.add_reaction("❌")

    delay = (event_time - current_time).total_seconds()
    if delay > 0:
        await asyncio.sleep(delay)
        await ctx.send(f"O evento está começando agora! {mention_text}")
    else:
        await ctx.send(f"O evento que foi programado para {data_hora} já começou.")

# Comando para exibir a melhor composição para um mapa
@bot.command(name='mapa')
async def get_map_stats(ctx, map_name: str):
    """
    Comando para exibir a composição sugerida para um mapa
    Exemplo de uso: !mapa ascent
    """
    map_stats = {
        'ascent': "Composição: Jett, Sova, Astra, KAY/O, Killjoy",
        'bind': "Composição: Raze, Viper, Brimstone, Sova, Sage",
        'haven': "Composição: Jett, Sova, Astra, Breach, Killjoy",
        'split': "Composição: Raze, Omen, Cypher, Sova, Sage"
    }
    
    stats = map_stats.get(map_name.lower(), "Mapa não encontrado. Tente 'ascent', 'bind', 'haven', ou 'split'.")
    await ctx.send(stats)

# Comando para designar funções manualmente
@bot.command(name='designar_funcoes')
async def assign_roles(ctx, *players: discord.Member):
    """
    Comando para permitir que jogadores escolham suas funções no jogo.
    Exemplo de uso: !designar_funcoes @player1 @player2 @player3 @player4 @player5
    """
    if len(players) != 5:
        await ctx.send("Por favor, adicione exatamente 5 jogadores.")
        return
    
    role_emojis = {
        'Duelista': '⚔️',
        'Iniciador': '🔮',
        'Controlador': '🌿',
        'Sentinela': '🛡️',
        'Flex': '🎯'
    }

    roles_assigned = {}

    for player in players:
        message = await ctx.send(f"{player.mention}, escolha sua função no jogo:\n"
                                 f"⚔️ - Duelista\n🔮 - Iniciador\n🌿 - Controlador\n🛡️ - Sentinela\n🎯 - Flex")

        for emoji in role_emojis.values():
            await message.add_reaction(emoji)

        def check(reaction, user):
            return user == player and str(reaction.emoji) in role_emojis.values()

        try:
            reaction, _ = await bot.wait_for('reaction_add', timeout=60.0, check=check)
            selected_role = next(role for role, emoji in role_emojis.items() if emoji == str(reaction.emoji))
            roles_assigned[player] = selected_role
            await ctx.send(f"{player.mention} escolheu a função: {selected_role}")

        except asyncio.TimeoutError:
            await ctx.send(f"{player.mention} não escolheu uma função a tempo.")
    
    if roles_assigned:
        result = "Funções atribuídas:\n"
        for player, role in roles_assigned.items():
            result += f"{player.mention} - {role}\n"
        await ctx.send(result)
    else:
        await ctx.send("Nenhuma função foi atribuída.")

# Iniciar o bot
TOKEN = ''  # Substitua pelo token do bot
if TOKEN:
    bot.run(TOKEN)
else:
    logger.error("O token do bot não foi encontrado. Verifique a variável de ambiente.")    
