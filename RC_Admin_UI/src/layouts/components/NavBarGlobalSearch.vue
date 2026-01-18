<template>
  <VRow
    class="global-search--row"
  >
    <VCol cols="12">
      <div
        class="d-flex global-search--input-cover"
      >
        <VIcon
          icon="bx:search"
          class="v-icon global-search--v-icon"
        />
        <input 
          id=""
          type="text" 
          placeholder="Search"
          class="ml-2 global-search--input"
        >
      </div>
    </VCol>
  </VRow>
</template>

<style lang="scss">
.global-search--row {
  width: 75%;

  @media  screen and (max-width: 600px) {
    width: 100%;
  }

  .global-search--input-cover {
    padding: 6px 10px;
    border-radius: 8px;

    &:focus-within {
      outline: 0.07rem solid rgb(var(--v-theme-primary));
    }

    .global-search--v-icon {
      width:20px
    }

    .global-search--input {
      width: 100%;

      &:focus-visible {
        outline: none !important;
      }
    }
  }
}
</style>
