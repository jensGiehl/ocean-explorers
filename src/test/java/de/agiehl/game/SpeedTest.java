package de.agiehl.game;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

class SpeedTest {

    @ParameterizedTest
    @CsvSource({
            "RELAXED, 10000, 250, 200, 0.8, 1.0",
            "NORMAL, 8000, 375, 300, 1.0, 1.5",
            "FAST, 6000, 500, 400, 1.35, 2.0"
    })
    void preservesOriginalStartingTimesAndScoreRules(Speed speed, int duration, long correctPoints,
            long stoppingPoints, double multiplier, double scoreBoost) {
        assertThat(speed.roundDurationMillis(1)).isEqualTo(duration);
        assertThat(speed.roundDurationMillis(9)).isEqualTo(duration);
        assertThat(speed.pointsFor(250, 1)).isEqualTo(correctPoints);
        assertThat(speed.pointsFor(200, 1)).isEqualTo(stoppingPoints);
        assertThat(speed.multiplier(1)).isEqualTo(multiplier);
        assertThat(speed.scoreBoost()).isEqualTo(scoreBoost);
        assertThat(speed.pointsFactor(1)).isEqualTo(scoreBoost);
        assertThat(speed.pointsFactor(9)).isEqualTo(scoreBoost);
    }

    @ParameterizedTest
    @EnumSource(Speed.class)
    void acceleratesFromQuestionTenAndCapsProgressionAtTwiceStartingSpeed(Speed speed) {
        assertThat(speed.roundDurationMillis(10))
                .isEqualTo((int) Math.round(speed.roundDurationMillis(1) / 1.025));
        assertThat(speed.pointsFor(250, 10))
                .isEqualTo(Math.round(250 * speed.scoreBoost() * 1.025));
        assertThat(speed.pointsFactor(10)).isEqualTo(speed.scoreBoost() * 1.025);
        assertThat(speed.roundDurationMillis(49)).isEqualTo(speed.roundDurationMillis(1) / 2);
        assertThat(speed.roundDurationMillis(500)).isEqualTo(speed.roundDurationMillis(49));
        assertThat(speed.multiplier(500)).isEqualTo(speed.multiplier(1) * 2);
        assertThat(speed.pointsFor(250, 500)).isEqualTo(speed.pointsFor(250, 1) * 2);
        assertThat(speed.pointsFactor(500)).isEqualTo(speed.scoreBoost() * 2);
    }
}
