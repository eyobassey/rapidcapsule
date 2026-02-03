<template>
    <div class="gender-page">
        <!-- Hero Section - Split Layout -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="goBack">
                    <v-icon name="hi-arrow-left" />
                    <span>Back</span>
                </button>
                <div class="hero__badge">
                    <span class="badge-step">Step 1 of 8</span>
                </div>
                <h1 class="hero__title">Select<br/><span class="hero__title-accent">Gender</span></h1>
                <p class="hero__subtitle">Choose the biological sex for this health assessment to ensure accurate results.</p>
            </div>
            <div class="hero__visual">
                <div class="gender-orb">
                    <div class="orb-ring orb-ring--1"></div>
                    <div class="orb-ring orb-ring--2"></div>
                    <div class="orb-core">
                        <v-icon name="hi-users" />
                    </div>
                </div>
                <div class="floating-icons">
                    <div class="float-icon float-icon--male"><v-icon name="io-male-sharp" /></div>
                    <div class="float-icon float-icon--female"><v-icon name="io-female-sharp" /></div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Gender Selection Card -->
            <div class="bento-card bento-card--selection">
                <div class="card-header">
                    <div class="card-header__icon">
                        <v-icon name="hi-user-circle" />
                    </div>
                    <div class="card-header__text">
                        <h3>Choose Gender</h3>
                        <p>Select the patient's biological sex</p>
                    </div>
                </div>

                <div class="gender-options">
                    <button class="gender-btn gender-btn--male" @click="onSelectedGender('male')">
                        <div class="gender-btn__icon">
                            <v-icon name="io-male-sharp" />
                        </div>
                        <div class="gender-btn__content">
                            <span class="gender-btn__title">Male</span>
                            <span class="gender-btn__desc">Biological male</span>
                        </div>
                        <v-icon name="hi-arrow-right" class="gender-btn__arrow" />
                    </button>

                    <button class="gender-btn gender-btn--female" @click="onSelectedGender('female')">
                        <div class="gender-btn__icon">
                            <v-icon name="io-female-sharp" />
                        </div>
                        <div class="gender-btn__content">
                            <span class="gender-btn__title">Female</span>
                            <span class="gender-btn__desc">Biological female</span>
                        </div>
                        <v-icon name="hi-arrow-right" class="gender-btn__arrow" />
                    </button>
                </div>
            </div>

            <!-- Why This Matters Card -->
            <div class="bento-card bento-card--info">
                <div class="info-card__icon">
                    <v-icon name="hi-light-bulb" />
                </div>
                <h4 class="info-card__title">Why does this matter?</h4>
                <p class="info-card__text">Biological sex affects disease risk, symptoms presentation, and medication responses. This helps our AI provide more accurate health insights.</p>
            </div>

            <!-- Privacy Card -->
            <div class="bento-card bento-card--privacy">
                <div class="privacy-content">
                    <v-icon name="hi-shield-check" />
                    <div class="privacy-text">
                        <strong>Your data is secure</strong>
                        <span>All health information is encrypted and private</span>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { inject } from "vue";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const goBack = () => {
    const { current } = navigator.value;
    useNavigator({ current, from: current, to: 0 });
};

const onSelectedGender = (gender) => {
    const { current } = navigator.value;
    usePatientInfo({ gender });
    useNavigator({ current, from: current, to: 2 });
};
</script>

<style scoped lang="scss">
// Design System
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$white: #FFFFFF;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$blue: #3B82F6;
$blue-light: #DBEAFE;
$pink: #EC4899;
$pink-light: #FCE7F3;

.gender-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 48px;
    max-width: 1400px;
    margin: 0 auto;

    @media (max-width: 768px) {
        padding: 0 16px 32px;
        gap: 20px;
    }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 40px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
    border-radius: 28px;
    position: relative;
    overflow: hidden;
    box-shadow:
        0 20px 60px rgba(2, 136, 209, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        padding: 32px 24px;
        gap: 24px;
        text-align: center;
    }

    &__content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        z-index: 2;
    }

    &__back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        width: fit-content;
        margin-bottom: 20px;

        @media (max-width: 768px) {
            margin: 0 auto 16px;
        }

        svg {
            width: 18px;
            height: 18px;
        }

        &:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateX(-4px);
        }
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        width: fit-content;
        margin-bottom: 20px;

        @media (max-width: 768px) {
            margin: 0 auto 16px;
        }

        .badge-step {
            font-size: 13px;
            font-weight: 600;
            color: white;
            letter-spacing: 0.3px;
        }
    }

    &__title {
        font-size: 48px;
        font-weight: 800;
        color: white;
        line-height: 1.1;
        margin: 0 0 16px;
        letter-spacing: -1px;

        @media (max-width: 768px) {
            font-size: 36px;
        }

        &-accent {
            background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    }

    &__subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0;
        max-width: 380px;

        @media (max-width: 768px) {
            font-size: 15px;
            max-width: 100%;
        }
    }

    &__visual {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        @media (max-width: 768px) {
            display: none;
        }
    }
}

// Gender Orb
.gender-orb {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.orb-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);

    &--1 {
        width: 100%;
        height: 100%;
        animation: spin-slow 20s linear infinite;
    }

    &--2 {
        width: 75%;
        height: 75%;
        animation: spin-slow 15s linear infinite reverse;
        border-style: dashed;
    }
}

.orb-core {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 0 40px rgba(255, 255, 255, 0.3),
        0 0 80px rgba(79, 195, 247, 0.3);
    animation: pulse-glow 3s ease-in-out infinite;

    svg {
        width: 48px;
        height: 48px;
        color: white;
    }
}

.floating-icons {
    position: absolute;
    width: 100%;
    height: 100%;
}

.float-icon {
    position: absolute;
    width: 48px;
    height: 48px;
    backdrop-filter: blur(10px);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: float 4s ease-in-out infinite;

    svg {
        width: 24px;
        height: 24px;
    }

    &--male {
        top: 10px;
        right: 10px;
        background: rgba($blue, 0.3);
        animation-delay: 0s;

        svg { color: white; }
    }

    &--female {
        bottom: 10px;
        left: 10px;
        background: rgba($pink, 0.3);
        animation-delay: 1s;

        svg { color: white; }
    }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
}

.bento-card {
    background: $white;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    // Selection Card (main)
    &--selection {
        padding: 28px;
        grid-row: span 2;

        @media (max-width: 900px) {
            grid-row: span 1;
        }

        @media (max-width: 640px) {
            padding: 24px 20px;
        }
    }

    // Info Card
    &--info {
        padding: 24px;
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
        border-color: #FCD34D;

        @media (max-width: 640px) {
            padding: 20px;
        }
    }

    // Privacy Card
    &--privacy {
        padding: 20px 24px;
        background: linear-gradient(135deg, $emerald-light 0%, #A7F3D0 100%);
        border-color: #6EE7B7;

        @media (max-width: 640px) {
            padding: 18px 20px;
        }
    }
}

.card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;

    &__icon {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

        svg {
            width: 26px;
            height: 26px;
            color: white;
        }
    }

    &__text {
        h3 {
            font-size: 20px;
            font-weight: 700;
            color: $navy;
            margin: 0 0 4px;
        }

        p {
            font-size: 14px;
            color: $gray;
            margin: 0;
        }
    }
}

// Gender Options
.gender-options {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gender-btn {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 22px 24px;
    background: $white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;

    @media (max-width: 640px) {
        padding: 18px 20px;
        gap: 14px;
    }

    &:hover {
        transform: translateY(-3px);

        .gender-btn__arrow {
            transform: translateX(4px);
        }
    }

    &__icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;

        @media (max-width: 640px) {
            width: 52px;
            height: 52px;
            border-radius: 14px;
        }

        svg {
            width: 30px;
            height: 30px;

            @media (max-width: 640px) {
                width: 26px;
                height: 26px;
            }
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: $navy;
        margin-bottom: 4px;

        @media (max-width: 640px) {
            font-size: 16px;
        }
    }

    &__desc {
        display: block;
        font-size: 14px;
        color: $gray;

        @media (max-width: 640px) {
            font-size: 13px;
        }
    }

    &__arrow {
        width: 22px;
        height: 22px;
        color: $light-gray;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    // Male variant
    &--male {
        .gender-btn__icon {
            background: linear-gradient(135deg, $blue-light 0%, #BFDBFE 100%);

            svg { color: $blue; }
        }

        &:hover {
            border-color: $blue;
            background: linear-gradient(135deg, #EFF6FF 0%, $blue-light 100%);
            box-shadow: 0 12px 32px rgba($blue, 0.2);

            .gender-btn__icon {
                background: linear-gradient(135deg, $blue 0%, #2563EB 100%);
                svg { color: white; }
            }

            .gender-btn__arrow { color: $blue; }
        }
    }

    // Female variant
    &--female {
        .gender-btn__icon {
            background: linear-gradient(135deg, $pink-light 0%, #FBCFE8 100%);

            svg { color: $pink; }
        }

        &:hover {
            border-color: $pink;
            background: linear-gradient(135deg, #FDF2F8 0%, $pink-light 100%);
            box-shadow: 0 12px 32px rgba($pink, 0.2);

            .gender-btn__icon {
                background: linear-gradient(135deg, $pink 0%, #DB2777 100%);
                svg { color: white; }
            }

            .gender-btn__arrow { color: $pink; }
        }
    }
}

// Info Card Content
.info-card {
    &__icon {
        width: 44px;
        height: 44px;
        background: rgba(245, 158, 11, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;

        svg {
            width: 24px;
            height: 24px;
            color: #D97706;
        }
    }

    &__title {
        font-size: 16px;
        font-weight: 600;
        color: #92400E;
        margin: 0 0 8px;
    }

    &__text {
        font-size: 14px;
        color: #A16207;
        line-height: 1.5;
        margin: 0;
    }
}

// Privacy Card Content
.privacy-content {
    display: flex;
    align-items: center;
    gap: 14px;

    > svg {
        width: 28px;
        height: 28px;
        color: #047857;
        flex-shrink: 0;
    }
}

.privacy-text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
        font-size: 15px;
        font-weight: 600;
        color: #065F46;
    }

    span {
        font-size: 13px;
        color: #047857;
    }
}

// ============================================
// ANIMATIONS
// ============================================
@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
    50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
</style>
