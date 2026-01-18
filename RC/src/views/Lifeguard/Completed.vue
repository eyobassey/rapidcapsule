<template>
  <LifeguardNav/>
  <div class="allcontent">
    <div class="container-first">
        <Illustrations name="check-circle-solid" class="newsvg"/>

      <div class="text-line">
        <h2>Congratulations</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquet ut
          adipiscing mattis elit consectetur dui. Diam venenatis tellus lacinia
          magna quam pulvinar. Convallis pellentesque sagittis, arcu sagittis.
          Eget pretium nec pretium enim porttitor volutpat dui vitae tincidunt.
          Massa pharetra in arcu et auctor. Aliquam massa arcu nulla lacus, erat
          ut nisi, ut accumsan. Lacus neque at velit mi in at. Congue eu quis in
          scelerisque congue lectus cras.
        </p>
      </div>
    </div>

    <div>
      <button>
      <router-link :to="{ name: 'SignupNew' }">Go to Profile</router-link>
    </button>
    </div>
  </div>
</template>

<script>
import Illustrations from "@/components/illustrations.vue";
import LifeguardNav from "@/components/Navigation/Lifeguardnav.vue";
export default {
  name: "Completed",
  components: {
    LifeguardNav,
    Illustrations,
  },
};
</script>

<style lang="scss" scoped>
// Define a variable for the primary color
$primary-color: #f16439;

// Define a mixin for a common button style
@mixin button-style {
  padding: 16px 32px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: "Segoe UI";
  border: none;
  width: 283px;
  height: 56px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 600;
  background-color: $primary-color;
  color: white;
  // text-decoration: none;

  &:hover {
    background-color: darken($primary-color, 10%);
  }
}

// Nest your styles for the component
.allcontent {
  width: 100%;
  height: 100%;
  background-color: white;
  margin: 20px 30px;
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;

  a {
    text-decoration: none;
  }

  .container-first {
    display: flex;
    margin-top: 1300px;
    flex-direction: row;
    align-items: center;
    gap: 72px;
    width: 70%;


    .text-line {
      margin-top: 10px;
      width: 100%;
      max-width: 690px;
      height: 310px;
      display: flex;
      align-items: flex-start;
      flex-direction: column;
      gap: 20px;

      h2 {
        color: #151515;
        font-family: "Segoe UI";
        line-height: 30px;
        font-size: 28px;
        font-weight: 600;
        align-items: center;
        // padding: 20px;
      }

      p {
        width: 100%;

        font-family: "Segoe UI";
        font-style: normal;
        font-weight: 400;
        font-size: 20px;
        line-height: 28px;
        color: #363636;
      }
    }

   
  }



  @media screen and (min-width: 290px) and (max-width: 1024px) {
    .container-first {
      margin: 0px 10px;
      width: 100%;
      flex-direction: column;
      text-align: left;
      gap: 20px;

      .text-line {
        margin: 5px;

        h2 {
          font-size: 18px;
        }

        p {
          font-size: 14px;
        }
      }
    }

    button {
      margin-top: 50px;
    }

  }
}





button {
  @include button-style;
  margin-top: 200px;
}


</style>
