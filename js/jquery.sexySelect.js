// sexySelect 0.2.9
// By Nick Ford
//
// TODO
//
// 1. Move open class to parent container
// 3. Style, add a fixed option for a set width
// 5. Write docs & set up repo
// 7. Option - leave multiple menus open
// 8. Move click delay outside and make an option
// 9. Fix bug where selected class isnt removed on close
// 10. Fix bug where scrolls to top on open

// DONE
//
// x. Fix issue where multiple menus can be open
// x. Make sure original menus change accordingly
// x. Lots of events firing when you just click toggle, move outside other event
// x. Event delegation on $(window) to allow for mouse events that end outside the element
// x. Standardize control functions
// x. Define some options

;(function() {
  if (!window.jQuery) {
    if (window.console) {
      console.error('sexySelect requires jQuery  http://jquery.com/download/');
    }
    return false;
  }
  
  var clickDuration = 100;
  var selectableElements = [
    '.sexy-select-menu', 
    '.sexy-select-menu .select-toggle', 
    '.sexy-select-menu span'
  ].join(', ');
  
  (function($) {

    // menu control functions
    function openMenu($menu) {
      console.log('openMenu()');
      var $alreadyOpen = $('.sexy-select-menu[data-open="true"]');
      if ($alreadyOpen.length > 0) closeMenu($alreadyOpen);
      $menu.children('.select-toggle').focus().addClass('open');
      setTimeout(function() { // fucking hacky
        $menu.attr('data-open', true);
      }, clickDuration);
    }

    function closeMenu($menu) {
      console.log('closeMenu()');
      $menu.attr('data-open', false);
      $menu.children('.select-toggle').removeClass('open'); //move blur out of here
      $menu.find('span').removeClass('selected');
      $menu.find('span[data-selected="true"]').addClass('selected');
    }

    function selectOption($selection, $master) {
      console.log('selectOption(' + $($selection).attr('data-value') + ')');
      var $parentMenu = $($selection).parent().parent().parent();
      var $siblingOptions = $parentMenu.find('span');
      $siblingOptions.removeClass('selected').attr('data-selected', false);
      $selection.addClass('selected').attr('data-selected', true);
      $parentMenu.children('.select-toggle').html($($selection).attr('data-value'));
      closeMenu($parentMenu);
      $($master).val($($selection).attr('data-value')) // update original
    }

    // construct dom elements
    function constructMenu(element, config) {
      var options = element.options;
      var $menu = $('<div class="sexy-select-menu"></div>');
      var $ul = $('<ul/>');
      var $toggle = $('<a/>', {
        class: 'select-toggle',
        href: '#',
        draggable: 'false'
      });
      if (config.disabled) {
        $menu.addClass('sexy-disabled');
        $toggle.attr('tabindex', -1);
      }
      if (config.width) {
        $menu.addClass('sexy-fixed');
        $menu.css('width', config.width);
        $menu.css('width', '100%');
      }

      var selectedOption;

      $.each(options, function(x) {
        var $li = $('<li/>');
        var $option = $('<span/>', {
          'data-value': options[x].value
        });
        $option.html(options[x].innerHTML);

        // add .selected class if an option is selected, otherwise use first
        if (options[x].selected || x < 1) selectedOption = $option;

        $li.append($option);
        $ul.append($li);
      })
      $menu.append($toggle);
      $menu.append($ul);

      selectOption(selectedOption, element)

      // attach individual event handlers
      var startTime, 
          endTime,
          hovering;
          //longPress = false // this is hacky

      $menu.attr('data-open', false);

      $menu.on({
        mousedown: function(e) {
          e.preventDefault() // prevent blur
          if (($(e.target).hasClass('select-toggle'))) {
            startTime = new Date().getTime();
            if (!$(e.target).hasClass('open')) {
              var $parentMenu = $(e.target).parent();
              openMenu($parentMenu);
            }
          }
        },
        mousemove: function(e) {
          if ($(e.target) != hovering) {
            $ul.find('span').removeClass('active');
            $(e.target).addClass('active');
            hovering = $(e.target);
          }
        },
        mouseup: function(e) {
          if ($(e.target).is('ul li span')) {
            selectOption($(e.target), element);
          }
        }
      });

      $toggle.on({
        mouseup: function(e) {
          endTime = new Date().getTime();

          if (endTime - startTime < 250) {
            console.log('not longPress');
            longPress = false;
            //if ($menu.attr('data-open') == 'true') closeMenu($menu);
          } else if (endTime - startTime >= 300) {
            console.log('longPress');
            longPress = true;
          }
        }
      });

      $ul.find('span').on('click', function() {
        if (!$(this).hasClass('selected')) selectOption($(this), element);
      });

      return $menu;
    };

    // init one-time event listeners

    $(window).on({
      mouseup: function(e) {
        var $openToggle = $('.sexy-select-menu a.select-toggle.open');
        var $openMenu = $openToggle.parent();
        if ($openMenu.length > 0) {
          if (!$(e.target).is(selectableElements) || longPress) closeMenu($openMenu)
        }
      },
      keydown: function(e){
        var $openMenu = $('.sexy-select-menu a.select-toggle.open');
        if ($openMenu.length > 0) {
          var currentOption = $openMenu.siblings('ul').find('span.selected');
          if (e.which == 38) {
            // arrow up
            if (currentOption.parent().prev().length > 0) {
              currentOption.removeClass('selected');
              currentOption.parent().prev().children('span').addClass('selected');
            }
          } else if (e.which == 40) {
            // arrow down
            if (currentOption.parent().next().length > 0) {
              currentOption.removeClass('selected');
              currentOption.parent().next().children('span').addClass('selected');
            }
          } else if (e.which == 13) {
            // enter
            currentOption.attr('data-selected', true);
            $openMenu.html(currentOption.attr('data-value'));
            $openMenu.removeClass('open');
          } else if (e.which == 27) {
            // esc
            $openMenu.removeClass('open');
          }
        } else if ($('.sexy-select-menu a.select-toggle').is(':focus')) {
          if (e.which == 13 || e.which == 40 || e.which == 38) {
            e.preventDefault();
            $('.sexy-select-menu a.select-toggle:focus').addClass('open').siblings('ul').find('span').removeClass('selected');
            $('.sexy-select-menu a.select-toggle:focus').addClass('open').siblings('ul').find('span[data-selected="true"]').addClass('selected');
          }
        }
      }
    });


    // Sexy class

    var Sexy = function(element, config) {
      // were any config options passed
      config = config || {};
      // hide the original <select> element
      Sexy.hidden = $(element).addClass('sexy-select--hidden');
      // check if the <select> was disabled
      if (element.disabled) config.disabled = true;
      // build the menu elements and append
      $(constructMenu(element, config)).insertAfter($(element));
    };

    // jQuery plugin

    $.fn.sexySelect = function(options) {
      var self = this;
      if (this.length < 1) {
        if (window.console) {
          console.warn('No instances of \'' + this.selector + '\'');
          return false;
        }
      }
      return this.each(function() {
        var newObj = new Sexy(this, options);
      });
    };
  })(jQuery);
}());