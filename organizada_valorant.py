import discord
from discord.ext import commands
import asyncio
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup

# Configuração do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('discord')

# Definir intents
intents = discord.Intents.default()
intents.messages = True
intents.reactions = True
intents.guilds = True
intents.members = True
intents.message_content = True  # Habilitar a intenção de conteúdo de mensagens

# Prefixo para comandos
bot = commands.Bot(command_prefix='!', intents=intents)

# Armazenar IDs de mensagens de eventos e roles
event_messages = {}

# Emojis e roles
role_emojis = {
    'Duelista': '⚔️',
    'Iniciador': '🔮',
    'Controlador': '🌿',
    'Sentinela': '🛡️',
    'Flex': '🎯'
}

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

# Evento on_reaction_add
@bot.event
async def on_reaction_add(reaction, user):
    # Verifica se a reação é uma das reações esperadas e não foi feita pelo bot
    if user == bot.user:
        return

    message_id = reaction.message.id
    if message_id in event_messages:
        channel_id, event_time, confirmed_users = event_messages[message_id]
        channel = bot.get_channel(channel_id)

        # Verificar se a reação corresponde a uma função
        if reaction.emoji in role_emojis.values():
            role_name = next(role for role, emoji in role_emojis.items() if emoji == str(reaction.emoji))

            # Registrar o usuário com a função escolhida
            confirmed_users[user] = role_name
            await channel.send(f"{user.mention} escolheu a função **{role_name}** no evento `{message_id}`.")

# Função para puxar dados do site vstats.gg
def get_map_comps(map_name, url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Pega as 3 primeiras composições
    comps = soup.find_all('div', class_='team-comp')[:3]
    comp_data = []
    for comp in comps:
        agents = comp.find_all('span', class_='agent-name')
        agent_names = [agent.get_text() for agent in agents]
        comp_data.append(", ".join(agent_names))

    return comp_data

# Comando !mapa
@bot.command(name='mapa')
async def mapa(ctx, nome_mapa: str):
    """
    Comando para buscar as melhores composições de um mapa.
    """
    mapas_urls = {
        'abyss': 'https://www.vstats.gg/agents?table=comps&map=Infinity&min_matches=500',
        'ascent': 'https://www.vstats.gg/agents?table=comps&map=Ascent&min_matches=500',
        'bind': 'https://www.vstats.gg/agents?table=comps&map=Duality&min_matches=500',
        'haven': 'https://www.vstats.gg/agents?table=comps&map=Triad&min_matches=500',
        'icebox': 'https://www.vstats.gg/agents?table=comps&map=Port&min_matches=500',
        'lotus': 'https://www.vstats.gg/agents?table=comps&map=Jam&min_matches=500',
        'sunset': 'https://www.vstats.gg/agents?table=comps&map=Juliett&min_matches=500'
    }

    if nome_mapa.lower() in mapas_urls:
        url = mapas_urls[nome_mapa.lower()]
        comps = get_map_comps(nome_mapa, url)
        if comps:
            await ctx.send(f"As melhores composições para o mapa {nome_mapa} são:\n" + "\n".join(comps))
        else:
            await ctx.send(f"Não foram encontradas composições para o mapa {nome_mapa}.")
    else:
        await ctx.send(f"Mapa {nome_mapa} não encontrado. Os mapas disponíveis são: {', '.join(mapas_urls.keys())}.")

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
        description=f"Evento marcado para {data_hora}. Escolha sua função para confirmar presença!",
        color=discord.Color.blue()
    )
    message = await ctx.send(content=mention_text, embed=embed)
    
    # Adicionar reações para funções
    for emoji in role_emojis.values():
        await message.add_reaction(emoji)

    # Armazenar o ID da mensagem do evento, além de um dicionário para confirmados
    event_messages[message.id] = (ctx.channel.id, data_hora, {})

    # Tornar o message_id visível para o usuário
    await ctx.send(f"O evento foi criado com sucesso! O ID da mensagem do evento é: `{message.id}`. Use este ID para verificar quem confirmou ou cancelar o evento.")

    delay = (event_time - datetime.utcnow()).total_seconds()
    if delay > 0:
        await asyncio.sleep(delay)
        await ctx.send(f"O evento está começando agora! {mention_text}")
    else:
        await ctx.send(f"O evento que foi programado para {data_hora} já começou.")

# Comando para ver quem confirmou presença e suas funções
@bot.command(name='confirmados')
async def ver_confirmados(ctx, message_id: int):
    """
    Comando para exibir quem confirmou presença e a função escolhida.
    Exemplo de uso: !confirmados 123456789012345678
    """
    if message_id in event_messages:
        channel_id, event_time, confirmed_users = event_messages[message_id]
        if confirmed_users:
            confirmados = "\n".join([f"{user.mention}: {role}" for user, role in confirmed_users.items()])
            await ctx.send(f"Os seguintes usuários confirmaram presença:\n{confirmados}")
        else:
            await ctx.send("Nenhum usuário confirmou presença ainda.")
    else:
        await ctx.send("ID da mensagem do evento não encontrado.")

# Comando para cancelar um evento
@bot.command(name='cancelar_evento')
async def cancelar_evento(ctx, message_id: int):
    """
    Comando para cancelar um evento usando o ID da mensagem.
    Exemplo de uso: !cancelar_evento 123456789012345678
    """
    if message_id in event_messages:
        channel_id, event_time, _ = event_messages.pop(message_id)
        channel = bot.get_channel(channel_id)
        if channel:
            try:
                message = await channel.fetch_message(message_id)
                await message.delete()
                await ctx.send(f"Evento programado para {event_time} foi cancelado.")
            except discord.NotFound:
                await ctx.send("Mensagem do evento não encontrada.")
        else:
            await ctx.send("Canal do evento não encontrado.")
    else:
        await ctx.send("ID da mensagem do evento não encontrado.")

# Iniciar o bot
TOKEN = 'SEU_TOKEN_AQUI'  # Substitua pelo token do bot
bot.run(TOKEN)
