function getPeriods(history, frequency) {
    return history.map(entry => {
            const date = new Date(entry.completedAt);
            date.setHours(0, 0, 0, 0);
            switch (frequency) {
                case 'Weekly': {
                    const start = new Date(date);
                    const day = start.getDay();
                    const diff = day === 0 ? -6 : 1 - day;
                    start.setDate(start.getDate() + diff);
                    start.setHours(0,0,0,0);
                    return start.getTime();
                }
                case 'Monthly':
                    return new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        1
                    ).getTime();
                default:

                    return date.getTime();
            }
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => b - a);
}

function calculateCurrentStreak(history, frequency) {
    if (!history?.length) {
        return 0;
    }
    const periods = getPeriods(history, frequency);
    let streak = 0;
    let expected = new Date();
    expected.setHours(0,0,0,0);
    if (frequency === 'Weekly') {
        const day = expected.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        expected.setDate(expected.getDate() + diff);
    }

    if (frequency === 'Monthly') {
        expected = new Date(
            expected.getFullYear(),
            expected.getMonth(),
            1
        );
    }

    const firstPeriod = periods[0];
    if (firstPeriod !== expected.getTime()) {
        if (frequency === 'Daily')
            expected.setDate(expected.getDate() - 1);
        else if (frequency === 'Weekly')
            expected.setDate(expected.getDate() - 7);
        else
            expected.setMonth(expected.getMonth() - 1);
    }

    for (const period of periods) {
        if (period !== expected.getTime()) {
            break;
        }

        streak++;
        if (frequency === 'Daily')
            expected.setDate(expected.getDate() - 1);
        else if (frequency === 'Weekly')
            expected.setDate(expected.getDate() - 7);
        else
            expected.setMonth(expected.getMonth() - 1);
    }
    return streak;
}

function calculateLongestStreak(history, frequency) {
    if (!history?.length) {
        return 0;
    }
    const periods = getPeriods(history, frequency).sort((a,b)=>a-b);
    let current = 1;
    let longest = 1;
    for (let i = 1; i < periods.length; i++) {
        const prev = new Date(periods[i-1]);
        const curr = new Date(periods[i]);
        let consecutive = false;
        if (frequency === 'Daily') {
            consecutive =
                (curr - prev) / (1000*60*60*24) === 1;
        }

        else if (frequency === 'Weekly') {
            consecutive =
                (curr - prev) / (1000*60*60*24) === 7;
        }

        else {
            consecutive =
                curr.getFullYear() === prev.getFullYear()
                    ? curr.getMonth() - prev.getMonth() === 1
                    : prev.getMonth() === 11 &&
                      curr.getMonth() === 0 &&
                      curr.getFullYear() === prev.getFullYear() + 1;
        }

        if (consecutive) {
            current++;
            longest = Math.max(longest, current);
        }
        else {
            current = 1;
        }
    }
    return longest;
}

module.exports = {
    calculateCurrentStreak,
    calculateLongestStreak
};