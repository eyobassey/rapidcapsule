<template>
  <div class="container">
    <div class="content-container">
        <h1 class="content-header">Appointment Terms & Agreement</h1>
        <div class="content-body">
            <p class="content-body__text">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ligula molestie fringilla amet turpis massa. Sit integer ultricies commodo id tristique pulvinar ipsum. Morbi phasellus mi elementum id pellentesque auctor. Leo elit lobortis pellentesque nec tristique mi rutrum. Nibh ullamcorper porta orci orci eget diam arcu. Ac nec penatibus sociis feugiat rhoncus viverra ut fermentum sed. Blandit proin purus laoreet mattis semper arcu. Ut at dignissim tristique urna in sem auctor viverra lobortis. Commodo purus consectetur sapien viverra. Enim turpis consectetur etiam vulputate cursus aliquam etiam. Augue tincidunt tincidunt elementum, tortor feugiat et adipiscing facilisis in. Tortor, molestie varius risus mattis nisi. Suspendisse at iaculis at sagittis.
                At odio odio ac venenatis senectus massa donec fames. Nulla at tortor malesuada turpis elementum. Enim tincidunt eros risus viverra ut. Imperdiet lectus leo eu orci pellentesque sit. Lectus viverra felis aliquam viverra nulla pulvinar malesuada. Non commodo in suspendisse dolor quis egestas semper fringilla. Cras facilisi eleifend elementum, felis. Tristique arcu molestie turpis est amet, eget. Aliquet purus, orci, suspendisse morbi pharetra nunc diam aliquam mus. Eget mauris senectus pulvinar eleifend ullamcorper. Etiam leo, dictum arcu interdum.
                Elit venenatis ornare tellus id sapien eget metus, odio aliquet. Donec consequat, bibendum quisque nec venenatis, libero dolor, vitae dui. Sed et, quis tempus egestas. Morbi tortor in quam nunc. Phasellus felis mollis blandit dolor mauris. Convallis dignissim ac, et porta non sed amet libero, dolor. Parturient egestas magna mauris a. Consequat, facilisis hendrerit nunc sit. Tortor commodo a, venenatis et. Sit ligula aliquam lectus diam sed quis. Ac congue enim elementum tellus pulvinar est ac nullam. Scelerisque a aliquam id scelerisque pulvinar.
            </p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
useBookingInfo({ heading: null, hasFooter: true });

const navigate = () => {
    const { current, from, to } = navigator.value;
    useNavigator({ current, from, to: 1 });
}

</script>

<style scoped lang="scss">
.container {
    width: 680px;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-44;
    padding: $size-32;
    position: relative;

    @include responsive(phone) {
        width: 100%;
        padding: $size-24;
        justify-content: center;
    }
}
.content-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-24;

    .content-header {
        font-weight: $fw-semi-bold;
        font-size: $size-24;
        color: $color-black;
        line-height: 36px;

        @include responsive(phone) {
            font-size: $size-20;
        }
    }
    .content-body {
        display: flex;
        flex-direction: column;
        gap: $size-24;

        .content-body__text {
            font-size: $size-16;
            font-weight: $fw-regular;
            color: $color-black;
            line-height: 24px;

            @include responsive(phone) {
                font-size: $size-16;
            }
        }
    }
}
</style>