import Point from './Point';

export default class BlueNoise {
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    swap(list, startIndex, endIndex) {
        const result = [...list];
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    }

    poissonDiskSampling(k, r, size) {
        const samples = [];
        const activeList = [];
        activeList.push(
            new Point(
                this.getRandomArbitrary(0, size),
                this.getRandomArbitrary(0, size)
            )
        );

        let len;
        while ((len = activeList.length) > 0) {
            // picks random index uniformly at random from the active list
            const index = this.getRandomInt(0, len);
            this.swap(activeList, len-1, index);
            const sample = activeList[len-1];
            let found = false;
            for (let i = 0; i < k; ++i) {
                // generates a point uniformly at random in the sample's
                // disk situated at a distance from r to 2*r
                const angle = 2*Math.PI*Math.random();
                const radius = this.getRandomArbitrary(0, r) + r;
                const dv = new Point(radius*Math.cos(angle), radius*Math.sin(angle));
                const newSample = dv.addVector(sample);

                let ok = true;
                for (let j = 0; j < samples.length; ++j) {
                    if (newSample.distanceFrom(samples[j]) <= r) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    if (
                        0 <= newSample.x && newSample.x < size &&
                        0 <= newSample.y && newSample.y < size
                    ) {
                        samples.push(newSample);
                        activeList.push(newSample);
                        len++;
                        found = true;
                    }
                }
            }
            if (!found) {
                activeList.splice(-1);
            }
        }

        return samples;
    }
}
