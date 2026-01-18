<template>
  <div class="comp-wrapper">
    <div class="comp-container">
      <Logos name="logo-full-color" class="logo" />
      <p>LifeGuard&#174;</p>

      <div class="nav-container">
        <div class="nav__icon">
          <Icons
            name="burger-menu"
            class="nav__icon--open"
            @click="state = true"
          />
        </div>
        <div class="nav" :class="{ open: state }">
          <div class="nav__icon">
            <Icons
              name="times"
              class="nav__icon--close"
              @click="state = false"
            />
          </div>
          <ul class="nav__list">
            <li class="nav__item">
              <router-link to="*" class="nav__link">Home</router-link>
            </li>
            <li class="nav__item">
              <router-link to="*" class="nav__link">About Us</router-link>
            </li>
            <li class="nav__item">
              <router-link to="*" class="nav__link">How it works</router-link>
            </li>
            <li class="nav__item">
              <router-link to="*" class="nav__link">FAQ</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'Loginlg' }">
				     <button>Login</button>

		      	</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'SignupNew' }">
				<button>Sign up</button>

			</router-link>
            </li>
<!-- 
            <Avatar
              size="medium"
              :firstname="userProfile.profile.first_name"
              :lastname="userProfile.profile.last_name"
              :extSrc="profileImage"
              v-model="profile.profile_photo"
            /> -->
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logos from "@/components/logos.vue";
import Icons from "@/components/icons.vue";
// import Avatar from "@/components/Avatars/avatar.vue";

export default {
  data() {
    return {
      state: false,
    };
  },
  components: {
    Logos,
    Icons,
    // Avatar,
  },

};
</script>

<style scoped lang="scss">
$primary-color: #F16439;
@mixin button-style {
	padding: 10px;
  margin: 10px;
	display: flex;
	flex-direction: row;
  justify-content: center;
	align-items: center;
	font-family: 'Segoe UI';
	border: 1px solid $primary-color;
	width: 100px;
	height: 40px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	background-color: white;
	color: $primary-color;
	// text-decoration: none;

	&:hover {
		background-color: darken($primary-color, 10%);
    color: white;

	}
}
.comp-wrapper {
  padding: $size-2 $size-0;
  border-bottom: 1px solid $color-g-90;
  width: 100%;
  position: fixed;
  z-index: 10;
  background-color: $color-white;
  top: 0;

  @include responsive(phone) {
    padding: $size-4 $size-0;
  }
  a {
		text-decoration: none;
	}
}

.comp-container {
  @include flexItem(horizontal) {
    align-items: center;
    gap: $size-24;
  }

  p {
    font-size: 20px;
    color: orangered;
    font-weight: 700;
  }

  width: min(1526px, 80%);
  margin-inline: auto;

  @include responsive(tab-landscape) {
    width: min(960px, 80%);
  }

  @include responsive(tab-portrait) {
    width: min(720px, 85%);
  }

  @include responsive(phone) {
    width: min(480px, 90%);
  }
}

.nav-container {
  @include flexItem(horizontal) {
    justify-content: flex-end;
    align-items: center;
    flex-grow: 1;
  }

  height: 100%;
}

.nav {
  @include flexItem(horizontal) {
    justify-content: flex-end;
    align-items: center;
  }

  @include responsive(tab-portrait) {
    @include flexItem(vertical) {
      justify-content: flex-start;
      gap: $size-32;
      flex-grow: 1;
    }

    position: absolute;
    top: 0;
    right: 0;
    height: 100vh;
    padding: 0 $size-32;

    background-color: $color-white;
    opacity: 0;
    transform: translateX(100%);
    transition: all 400ms ease-out;

    & .nav__icon {
      @include flexItem(horizontal) {
        justify-content: flex-end;
        flex-grow: 1;
      }

      padding: $size-24 $size-0;
    }
  }

  @include responsive(phone) {
    @include flexItem(vertical) {
      justify-content: flex-start;
      gap: $size-32;
      flex-grow: 1;
    }

    position: absolute;
    top: 0;
    right: 0;
    height: 100vh;
    padding: $size-0 $size-16;

    background-color: $color-white;
    opacity: 0;
    transform: translateX(100%);
    transition: all 400ms ease-out;

    & .nav__icon {
      @include flexItem(horizontal) {
        justify-content: flex-end;
        flex-grow: 1;
      }

      padding: $size-24 $size-0;
    }
  }

  &__list {
    @include flexItem(horizontal) {
      align-items: center;
    }

    list-style: none;

    @include responsive(tab-portrait) {
      @include flexItem(vertical);
      padding: $size-32;
    }
  }

  &__item {
    padding: $size-0 $size-32;

    @include responsive(tab-portrait) {
      padding: $size-32;
      font-size: $size-44;
      font-weight: $fw-medium;
      line-height: 1.5;
      letter-spacing: 0.02em;
    }

    @include responsive(phone) {
      padding: $size-32;
      font-size: $size-44;
      font-weight: $fw-medium;
      line-height: 1.5;
      letter-spacing: 0.02em;
    }
  }

  &__link {
    text-decoration: none;
    color: $color-black;
    text-align: center;

    &:hover,
    &:active {
      color: $color-pri;
    }
  }
}

.nav__icon {
  display: none;

  @include responsive(tab-portrait) {
    display: block;
  }
}

.open {
  right: 0;
  transform: translateX(0);
  opacity: 1;
}

button {
	@include button-style;


}
</style>
