// Constants
//var Guild = '711701998508179568' // DEV
var Guild = '710404448157040661' // PROD

// Classes
var navigation = new LTENavigation();

// Variables
var guild;

// Connect socket
var socket;
io.sails.reconnectionAttempts = Infinity;
socket = io.sails.connect();

socket.on('connect', () => {
    getGuildInformation();
});

// Requests
var noReq = new APIreq(socket, null);

// Do things when the DOM has fully loaded
window.addEventListener('DOMContentLoaded', () => {

    // Set Navigation
    navigation.addItem('#nav-home', '#section-home', 'Undertale Underground', '/', true, () => {
        if (socket.isConnected()) {
            getGuildInformation();
        }
    })
    navigation.addItem('#nav-lore', '#section-lore', 'Lore - Undertale Underground', '/lore', false);
    // navigation.addItem('#nav-members', '#section-members', 'Members - Undertale Underground', '/members', false);
    // navigation.addItem('#nav-events', '#section-events', 'Events - Undertale Underground', '/events', false);
    navigation.addItem('#nav-rules', '#section-rules', 'Rules - Undertale Underground', '/rules', false);

});

// Function for getting the current guild information from the API and putting some of it on the webpage
function getGuildInformation () {
    try {
        noReq.request({ method: 'post', url: '/guild/get', data: { guild: Guild } }, (response) => {
            if (!response) {
                $(document).Toasts('create', {
                    class: 'bg-danger',
                    title: 'Error getting guild information',
                    body: 'There was an error getting guild information. Please report this to the staff.',
                    icon: 'fas fa-skull-crossbones fa-lg',
                });
            } else {
                guild = response;
                $('.guild-name').html(guild.name);
                $('.guild-logo').attr("src", guild.icon);
                $('.guild-nummembers').html(guild.numMembers);
                $('.guild-numbots').html(guild.numBots);
            }
        })
    } catch (e) {
        $(document).Toasts('create', {
            class: 'bg-danger',
            title: 'Error getting guild information',
            body: 'There was an error getting guild information. Please report this to the staff.',
            icon: 'fas fa-skull-crossbones fa-lg',
        });
        console.error(e);
    }
}