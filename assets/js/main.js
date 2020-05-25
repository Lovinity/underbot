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
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8; max-width: 32px; max-height: 32px;">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}">
                        <div class="content-wrapper">
                        <!-- Content Header (Page header) -->
                        <div class="content-header">
                          <div class="container-fluid">
                            <div class="row mb-2">
                              <div class="col-sm-6">
                                <h1 class="m-0 text-dark">${character.name}</h1>
                              </div><!-- /.col -->
                            </div><!-- /.row -->
                          </div><!-- /.container-fluid -->
                        </div>

                        <div class="content">
                        <div class="callout callout-success">
                <h5>Character is unclaimed!</h5>
                <p>This character has not been claimed yet! Join our guild (under "Home") and create a character sheet (as per instructions in the guild) to claim this character!</p>
              </div>
                        </div>
                        </div>
                        </section>`);
                        navigation.addItem(`#nav-character-${character.uid}`, `#section-character-${character.uid}`, `${character.name} - Undertale Underground`, `/character/${character.uid}`, false);
                    })

                // Process claimed OG characters
                $('#nav-og-claimed').html('');
                guild.characters
                    .filter((character) => character.claimed && !character.OC)
                    .map((character) => {
                        $('#nav-og-claimed').append(`<li class="nav-item">
                        <a href="#" class="nav-link" id="nav-character-${character.uid}" title="${character.name} character sheet">
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8; max-width: 32px; max-height: 32px;">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}">
                        <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
      <!-- Content Header (Page header) -->
      <div class="content-header">
        <div class="container-fluid">
          <div class="row mb-2">
            <div class="col-sm-6">
              <h1 class="m-0 text-dark">${character.name}</h1>
            </div><!-- /.col -->
          </div><!-- /.row -->
        </div><!-- /.container-fluid -->
      </div>
      <!-- /.content-header -->

      <!-- Main content -->
      <div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-lg-12">
              <div class="card card-widget widget-user">
                <!-- Add the bg color to the header using any of the bg-* classes -->
                <div class="widget-user-header text-white"
                  style="background: url('/images/Characters/photos/${character.photo}') center center; background-size:cover; height: 384px;"
                  id="profile-background">
                  <div style="background-color: rgba(0, 0, 0, 0.7);">
                    <h3 class="widget-user-username">${character.name}</h3>
                    <h5 class="widget-user-desc">Claimed by ${character.owner}</h5>
                  </div>
                </div>
                <div class="widget-user-image" style="top: 206px;">
                  <img class="img-circle" src="/images/Characters/sprites/${character.sprite}" alt="Sprite">
                </div>
                <div class="card-footer">
                  <div class="row">
                    <div class="col-sm-4 border-right">
                      <div class="description-block">
                        <h5 class="description-header">${character.LVL} / ${character.EXP}</h5>
                        <span class="description-text">LVL / EXP</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                    <div class="col-sm-4 border-right">
                      <div class="description-block">
                        <h5 class="description-header">${character.ATK}</h5>
                        <span class="description-text">ATK</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                    <div class="col-sm-4">
                      <div class="description-block">
                        <h5 class="description-header">${character.DEF}</h5>
                        <span class="description-text">DEF</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                  </div>
                  <!-- /.row -->
                </div>
              </div>
            </div>
          </div>
          <!-- /.row -->
          <div class="row">
            <div class="col">
                <div class="progress" style="height: 30px;">
                  <div class="progress-bar bg-success" role="progressbar" style="width: ${character.HPPercent}%;" aria-valuenow="${character.HPPercent}" aria-valuemin="0" aria-valuemax="100">${character.HP} / ${character.maxHP} HP</div>
                </div>
            </div>
          </div>

          <div class="row">
            <div class="col-lg-6 col-12">
              <div class="card card-primary">
                <div class="card-header">
                  <h3 class="card-title">Quick Information</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Nicknames</strong>
                  <p class="text-muted">${character.nicknames}</p>
                  <hr>

                  <strong>Pronouns</strong>
                  <p class="text-muted">${character.pronouns}</p>
                  <hr>
                  
                  <strong>Age</strong>
                  <p class="text-muted">${character.age}</p>
                  <hr>
                  
                  <strong>Height</strong>
                  <p class="text-muted">${character.height}</p>
                  <hr>
                  
                  <strong>Soul Type</strong>
                  <p class="text-muted">${character.soulType}</p>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-info">
                <div class="card-header">
                  <h3 class="card-title">Personality</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Personality</strong>
                  <p class="text-muted">${character.personality}</p>
                  <hr>

                  <strong>Likes</strong>
                  <p class="text-muted">${character.likes}</p>
                  <hr>
                  
                  <strong>Dislikes</strong>
                  <p class="text-muted">${character.dislikes}</p>
                  <hr>
                  
                  <strong>Height</strong>
                  <p class="text-muted">${character.height}</p>
                  <hr>
                  
                  <strong>Soul Type</strong>
                  <p class="text-muted">${character.soulType}</p>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-danger">
                <div class="card-header">
                  <h3 class="card-title">Physique / Items</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Appearance</strong>
                  <p class="text-muted">${character.appearance}</p>
                  <hr>

                  <strong>Weapons</strong>
                  <p class="text-muted">${character.weapons}</p>
                  <hr>
                  
                  <strong>Armor</strong>
                  <p class="text-muted">${character.armor}</p>
                  <hr>
                  
                  <strong>Items</strong>
                  <p class="text-muted">${character.items.map((item) => `<strong>${item.name}</strong>: ${item.description}`).join("<br />")}</p>
                  <hr>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-danger">
                <div class="card-header">
                  <h3 class="card-title">Extra Information</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  ${character.extraInfo}
                </div>
                <!-- /.card-body -->
              </div>
            </div>
    
          </div>

        </div><!-- /.container-fluid -->
      </div>
      <!-- /.content -->
    </div>
    <!-- /.content-wrapper -->
                        </section>`);
                        navigation.addItem(`#nav-character-${character.uid}`, `#section-character-${character.uid}`, `${character.name} - Undertale Underground`, `/character/${character.uid}`, false);
                    })

                // Process OC characters
                $('#nav-oc').html('');
                guild.characters
                    .filter((character) => character.claimed && character.OC)
                    .map((character) => {
                        $('#nav-oc').append(`<li class="nav-item">
                        <a href="#" class="nav-link" id="nav-character-${character.uid}" title="${character.name} character sheet">
                        <img src="/images/Characters/sprites/${character.sprite}" class="brand-image img-circle bg-white elevation-3" style="opacity: .8; max-width: 32px; max-height: 32px;">
                            <p>
                                ${character.name}
                            </p>
                        </a>
                    </li>`);
                        // TODO
                        $('#sections-characters').append(`<sction id="section-character-${character.uid}">
                        <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
      <!-- Content Header (Page header) -->
      <div class="content-header">
        <div class="container-fluid">
          <div class="row mb-2">
            <div class="col-sm-6">
              <h1 class="m-0 text-dark">${character.name}</h1>
            </div><!-- /.col -->
          </div><!-- /.row -->
        </div><!-- /.container-fluid -->
      </div>
      <!-- /.content-header -->

      <!-- Main content -->
      <div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-lg-12">
              <div class="card card-widget widget-user">
                <!-- Add the bg color to the header using any of the bg-* classes -->
                <div class="widget-user-header text-white"
                  style="background: url('/images/Characters/photos/${character.photo}') center center; background-size:cover; height: 384px;"
                  id="profile-background">
                  <div style="background-color: rgba(0, 0, 0, 0.7);">
                    <h3 class="widget-user-username">${character.name}</h3>
                    <h5 class="widget-user-desc">Claimed by ${character.owner}</h5>
                  </div>
                </div>
                <div class="widget-user-image" style="top: 206px;">
                  <img class="img-circle" src="/images/Characters/sprites/${character.sprite}" alt="Sprite">
                </div>
                <div class="card-footer">
                  <div class="row">
                    <div class="col-sm-4 border-right">
                      <div class="description-block">
                        <h5 class="description-header">${character.LVL} / ${character.EXP}</h5>
                        <span class="description-text">LVL / EXP</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                    <div class="col-sm-4 border-right">
                      <div class="description-block">
                        <h5 class="description-header">${character.ATK}</h5>
                        <span class="description-text">ATK</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                    <div class="col-sm-4">
                      <div class="description-block">
                        <h5 class="description-header">${character.DEF}</h5>
                        <span class="description-text">DEF</span>
                      </div>
                      <!-- /.description-block -->
                    </div>
                    <!-- /.col -->
                  </div>
                  <!-- /.row -->
                </div>
              </div>
            </div>
          </div>
          <!-- /.row -->
          <div class="row">
            <div class="col">
                <div class="progress" style="height: 30px;">
                  <div class="progress-bar bg-success" role="progressbar" style="width: ${character.HPPercent}%;" aria-valuenow="${character.HPPercent}" aria-valuemin="0" aria-valuemax="100">${character.HP} / ${character.maxHP} HP</div>
                </div>
            </div>
          </div>

          <div class="row">
            <div class="col-lg-6 col-12">
              <div class="card card-primary">
                <div class="card-header">
                  <h3 class="card-title">Quick Information</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Nicknames</strong>
                  <p class="text-muted">${character.nicknames}</p>
                  <hr>

                  <strong>Pronouns</strong>
                  <p class="text-muted">${character.pronouns}</p>
                  <hr>
                  
                  <strong>Age</strong>
                  <p class="text-muted">${character.age}</p>
                  <hr>
                  
                  <strong>Height</strong>
                  <p class="text-muted">${character.height}</p>
                  <hr>
                  
                  <strong>Soul Type</strong>
                  <p class="text-muted">${character.soulType}</p>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-info">
                <div class="card-header">
                  <h3 class="card-title">Personality</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Personality</strong>
                  <p class="text-muted">${character.personality}</p>
                  <hr>

                  <strong>Likes</strong>
                  <p class="text-muted">${character.likes}</p>
                  <hr>
                  
                  <strong>Dislikes</strong>
                  <p class="text-muted">${character.dislikes}</p>
                  <hr>
                  
                  <strong>Height</strong>
                  <p class="text-muted">${character.height}</p>
                  <hr>
                  
                  <strong>Soul Type</strong>
                  <p class="text-muted">${character.soulType}</p>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-danger">
                <div class="card-header">
                  <h3 class="card-title">Physique / Items</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  <strong>Appearance</strong>
                  <p class="text-muted">${character.appearance}</p>
                  <hr>

                  <strong>Weapons</strong>
                  <p class="text-muted">${character.weapons}</p>
                  <hr>
                  
                  <strong>Armor</strong>
                  <p class="text-muted">${character.armor}</p>
                  <hr>
                  
                  <strong>Items</strong>
                  <p class="text-muted">${character.items.map((item) => `<strong>${item.name}</strong>: ${item.description}`).join("<br />")}</p>
                  <hr>
                  
                </div>
                <!-- /.card-body -->
              </div>
            </div>
            
            <div class="col-lg-6 col-12">
              <div class="card card-danger">
                <div class="card-header">
                  <h3 class="card-title">Extra Information</h3>
                </div>
                <!-- /.card-header -->
                <div class="card-body">
                  ${character.extraInfo}
                </div>
                <!-- /.card-body -->
              </div>
            </div>
    
          </div>

        </div><!-- /.container-fluid -->
      </div>
      <!-- /.content -->
    </div>
    <!-- /.content-wrapper -->
                        </section>`);
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