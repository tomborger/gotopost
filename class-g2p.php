<?php

/**
 * Manages plugin setup, enqueues scripts and styles, prints app template.
 *
 * @since 0.0.1
 */
class G2P {

	/**
	 * Path to manifest file.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $manifest;

	/**
	 * Previewer object.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $previewer;

	/**
	 * The fields from the posts table to be included in the manifest.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $fields = array(
		'ID',
		'post_title',
		'post_status',
		'post_type',
	);


	/* ------------------------------------------------------------------------ *
	 * Scripts and Styles
	 * ------------------------------------------------------------------------ */
	
	/**
	 * Enqueue scripts.
	 *
	 * @since 0.0.1
	 */
	function enqueue_scripts() {

		$screen = get_current_screen();

		// Components
		wp_enqueue_script(
			'g2p_mousetrap',
			plugins_url( 'components/mousetrap/mousetrap.min.js', __FILE__ ),
			false,
			false
		);
		wp_enqueue_script(
			'g2p_mousetrap_bindglobal',
			plugins_url( 'components/mousetrap/mousetrap-global-bind.min.js', __FILE__ ),
			false,
			false
		);
		wp_enqueue_script(
			'g2p_swiper',
			plugins_url( 'components/swiper/idangerous.swiper.min.js', __FILE__ ),
			false,
			false
		);
		wp_enqueue_script(
			'g2p_angular',
			plugins_url( 'components/angular/angular.min.js', __FILE__ ),
			false,
			false
		);
		wp_enqueue_script(
			'g2p_angular_sanitize',
			plugins_url( 'components/angular/angular-sanitize.min.js', __FILE__ ),
			array( 'g2p_angular' ),
			false
		);

		// GoToPost scripts
		wp_enqueue_script(
			'g2p_c_g2p',
			plugins_url( 'js/controllers/g2p.js', __FILE__ ),
			array( 'jquery', 'g2p_angular', 'g2p_mousetrap', 'g2p_mousetrap_bindglobal', 'g2p_swiper' ),
			false
		);
		wp_enqueue_script(
			'g2p_s_manifest',
			plugins_url( 'js/services/manifest.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_s_focus',
			plugins_url( 'js/services/focus.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_s_preview',
			plugins_url( 'js/services/preview.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_d_menu',
			plugins_url( 'js/directives/menu.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_d_typeslider',
			plugins_url( 'js/directives/typeslider.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_d_type',
			plugins_url( 'js/directives/type.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		wp_enqueue_script(
			'g2p_f_page',
			plugins_url( 'js/filters/page.js', __FILE__ ),
			array( 'g2p_c_g2p' ),
			false
		);
		
		if( 'settings_page_gotopost' == $screen->id ) {
			wp_enqueue_script(
				'g2p_c_settings',
				plugins_url( 'js/controllers/settings.js', __FILE__ ),
				array( 'g2p_c_g2p' ),
				false
			);
		}

		$this->print_data();

	}


	/**
	 * Enqueue styles.
	 *
	 * @since 0.0.1
	 */
	function enqueue_styles() {
		wp_enqueue_style( 
			'g2p_css',
			plugins_url( 'css/g2p.css', __FILE__ ),
			false,
			false
		);
		wp_enqueue_style(
			'g2p_swiper_css',
			plugins_url( 'components/swiper/idangerous.swiper.css', __FILE__ ),
			false,
			false
		);
	}
	

	/* ------------------------------------------------------------------------ *
	 * Print
	 * ------------------------------------------------------------------------ */
	
	/**
	 * Print data needed by scripts.
	 *
	 * @since 0.0.1
	 */
	function print_data() {

		wp_localize_script( 
			'g2p_c_g2p', 
			'g2pData', 
			array(
				'getManifestNonce' => wp_create_nonce( 'getManifest' ),
				'getChangelogNonce' => wp_create_nonce( 'getChangelog' ),
				'built' => get_option( 'g2p_manifest_built', null ),
				'changed' => get_option( 'g2p_manifest_changed', null ),
				'templates' => plugins_url( 'js/templates/', __FILE__ ),
				'types' => $this->get_included_types(),
				'fields' => $this->fields,
			)
		);

	}


	/**
	 * Add application template to footer. (Not Angular Zen, but ... simpler.)
	 *
	 * @since 0.0.1
	 */
	function print_app_template() {

		?>

		<div id='g2p' ng-app='g2p' ng-controller='g2pCtrl'>

			<!-- menu.js -->
			<div class='g2p-menu'>
				<ul class='g2p-menu-items wp-ui-primary'>
					<li class='g2p-menu-item wp-ui-highlight' ng-repeat='type in types'>
						<span class='g2p-menu-item-content wp-ui-primary {{type.icon}}' ng-class="{ 'active': type.slug === activeType }"  ng-mousedown='selectType( $index )'></span>
					</li>
				</ul>
			</div>

			<!-- typeslider.js -->
			<div class='g2p-type-slider'>

				<div class='swiper-container'>
					<div class='swiper-wrapper'>

						<!-- type.js -->
						<div class='swiper-slide g2p-type' ng-repeat='type in types' slug='{{type.slug}}'>

							<div class='g2p-type-header'>
								<div class='g2p-type-placard'>
									<span class='g2p-type-icon {{type.icon}}'></span>
									<span class='g2p-type-label'>{{type.label}}</span>
								</div>
								<input class='g2p-type-search' placeholder='Search by title' ng-model='titleSearch' ng-change='refresh()'>
							</div>

							<ul class='g2p-type-items'>
								<li class='g2p-type-item wp-ui-highlight' ng-repeat="obj in resultSet = ( manifest | filter:{ post_type:type.slug, post_title:titleSearch } | page:currentPage:( itemsPerPage = 9 ) )">
									<a class='g2p-type-item-content wp-ui-primary' href='post.php?post={{obj.ID}}&amp;action=edit' ng-class="{ 'active': $index === $parent.activeIndex }" ng-click='activatePost( $event, $index )'>{{obj.post_title}}</a>
								</li>
								<li class='g2p-type-item-notification' ng-if='resultSet.length === 0'>No results found.</li>
							</ul>

						</div>

					</div>
				</div>

				<div class='g2p-preview-frame'>
					<div class='g2p-preview' ng-bind-html='preview.content'></div>
				</div>

			</div>
		</div>

		<?php

	}


	/* ------------------------------------------------------------------------ *
	 * Settings
	 * ------------------------------------------------------------------------ */

	/**
	 * Register settings page.
	 *
	 * @since 0.0.1
	 */
	function register_settings_page() {

		add_options_page(
			'GoToPost Settings',
			'GoToPost',
			'manage_options',
			'gotopost',
			array( $this, 'render_settings_page' )
		);

	}


	/**
	 * Render settings page; simplistic for now.
	 *
	 * @since 0.0.1
	 */
	function render_settings_page() {

		?>

		<div class='wrap' ng-app='g2p' ng-controller='settingsCtrl'>
			<h3>Click to regenerate manifest. (This will also happen once per day with wp-cron.)</h3>
			<a class='button button-primary' ng-click='buildManifest()'>Regenerate</a>
			<p ng-if='complete'>Manifest regenerated. Reload the page and let's make some magic!</p>
		</div>

		<?php

	}


	/* ------------------------------------------------------------------------ *
	 * Utilities
	 * ------------------------------------------------------------------------ */

	 /**
	  * Get included post types.
	  *
	  * @since 0.0.1
	  * @return array $types Slug, label, and dashicon name for each post type
	  */
	function get_included_types() {

		$included_types = array();

		$post_types = get_post_types( array(), 'objects' );

		// Add icon names for default post types (not defined in type object!)
		$type_icon_hash = array(
			'post' => 'dashicons-admin-post',
			'page' => 'dashicons-admin-page',
			'links' => 'dashicons-admin-links',
			'attachment' => 'dashicons-admin-media',
		);

		foreach( $post_types as $type ) {

			if( 'revision' == $type->name || 'nav_menu_item' == $type->name ) {
				continue;
			}

			if( isset( $type->menu_icon ) ) {
				$menu_icon = $type->menu_icon;
			} else {
				$menu_icon = isset( $type_icon_hash[ $type->name ] ) ? $type_icon_hash[ $type->name ] : null;
			}

			array_push( $included_types, array(
				'slug' => $type->name,
				'label' => $type->label,
				'icon' => $menu_icon,
			));

		}

		return $included_types;

	}

	
	/* ------------------------------------------------------------------------ *
	 * Setup
	 * ------------------------------------------------------------------------ */

	/**
	 * Set up plugin.
	 *
	 * @since 0.0.1
	 */
	function __construct() {

		// Create manifest
		$this->manifest = new G2PManifest( $this->fields );

		// Create preview handler
		$this->previewer = new G2PPreviewer();

		// Enqueue scripts and styles
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Add application container to admin footer
		add_action( 'admin_footer', array( $this, 'print_app_template' ) );

		// Create settings
		add_action( 'admin_menu', array( $this, 'register_settings_page' ) );

	}

}