// Constants
//var Guild = '711701998508179568' // DEV
var Guild = '710404448157040661' // PROD

// Classes
var navigation = new LTENavigation();

// Variables
var guild;

// Do things when the DOM has fully loaded
window.addEventListener('DOMContentLoaded', () => {

    // Set Navigation
    navigation.addItem('#nav-home', '#section-home', 'Undertale Underground', '/', true, () => {
        getGuildInformation();
    })
    navigation.addItem('#nav-lore', '#section-lore', 'Lore - Undertale Underground', '/lore', false);
    // navigation.addItem('#nav-members', '#section-members', 'Members - Undertale Underground', '/members', false);
    // navigation.addItem('#nav-events', '#section-events', 'Events - Undertale Underground', '/events', false);
    navigation.addItem('#nav-rules', '#section-rules', 'Rules - Undertale Underground', '/rules', false);

});

// Function for getting the current guild information from the API and putting some of it on the webpage
function getGuildInformation () {
    $.ajax('/guild/get', {
        type: 'POST',  // http method
        data: { guild: Guild },  // data to submit
        success: function (response, status, xhr) {
            if (response && typeof response.id !== 'undefined') {
                guild = response;
                $('.guild-name').html(guild.name);
                $('.guild-logo').attr("src", guild.icon);
                $('.guild-nummembers').html(guild.numMembers);
                $('.guild-numbots').html(guild.numBots);
                $('.guild-claimedcharacters').html(guild.claimedCharacters);
                $('.guild-unclaimedcharacters').html(guild.unclaimedCharacters);

                $('#sections-characters').html('');

                // Process unclaimed characters
                $('#nav-og-unclaimed').html('');
                guild.characters
                    .filter((character) => !character.claimed)
                    .map((character) => {
                        $('#nav-og-unclaimed').append(`<li class="nav-item">
                        <a href="#" class="nav-link" id="nav-character-${character.uid}" title="${character.name} character sheet">
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}"></section>`);
                        navigation.addItem(`#nav-character-${character.uid}`, `#section-character-${character.uid}`, `${character.name} - Undertale Underground`, `/character/${character.uid}`, false);
                    })

                // Process claimed OG characters
                $('#nav-og-claimed').html('');
                guild.characters
                    .filter((character) => character.claimed && !character.OC)
                    .map((character) => {
                        $('#nav-og-claimed').append(`<li class="nav-item">
                        <a href="#" class="nav-link" id="nav-character-${character.uid}" title="${character.name} character sheet">
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}"></section>`);
                        navigation.addItem(`#nav-character-${character.uid}`, `#section-character-${character.uid}`, `${character.name} - Undertale Underground`, `/character/${character.uid}`, false);
                    })

                // Process OC characters
                $('#nav-oc').html('');
                guild.characters
                    .filter((character) => character.claimed && character.OC)
                    .map((character) => {
                        $('#nav-oc').append(`<li class="nav-item">
                        <a href="#" class="nav-link" id="nav-character-${character.uid}" title="${character.name} character sheet">
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}"></section>`);
                        navigation.addItem(`#nav-character-${character.uid}`, `#section-character-${character.uid}`, `${character.name} - Undertale Underground`, `/character/${character.uid}`, false);
                    })
            } else {
                $(document).Toasts('create', {
                    class: 'bg-danger',
                    title: 'Error getting guild information',
                    body: 'There was an error getting guild information. Please report this to the staff.',
                    icon: 'fas fa-skull-crossbones fa-lg',
                });
            }
        },
        error: function (jqXhr, textStatus, errorMessage) {
            $(document).Toasts('create', {
                class: 'bg-danger',
                title: 'Error getting guild information',
                body: 'There was an error getting guild information. Please report this to the staff.',
                icon: 'fas fa-skull-crossbones fa-lg',
            });
            console.error(errorMessage);
        }
    });
}