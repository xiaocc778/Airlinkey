class FlightSimulator {
    constructor() {
        this.cities = [
            '北京', '上海', '广州', '深圳', '成都', 
            '重庆', '杭州', '西安', '武汉', '南京',
            '长沙', '青岛', '厦门', '昆明', '大连'
        ];
        
        this.airlines = ['CA', 'MU', 'CZ', 'HU', '3U', 'MF', 'ZH', 'GS'];
        this.flightNumbers = new Set(); // 用于确保航班号唯一
    }

    // 生成随机航班号
    generateFlightNumber() {
        let flightNumber;
        do {
            const airline = this.airlines[Math.floor(Math.random() * this.airlines.length)];
            const number = Math.floor(Math.random() * 9000) + 1000;
            flightNumber = `${airline}${number}`;
        } while (this.flightNumbers.has(flightNumber));
        
        this.flightNumbers.add(flightNumber);
        return flightNumber;
    }

    // 生成随机时间
    generateTime() {
        const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
        const minutes = (Math.floor(Math.random() * 12) * 5).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // 计算到达时间
    calculateArrivalTime(departureTime, duration) {
        const [hours, minutes] = departureTime.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes + duration;
        
        // 处理跨天的情况
        totalMinutes = totalMinutes % (24 * 60);
        
        const arrivalHours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const arrivalMinutes = (totalMinutes % 60).toString().padStart(2, '0');
        return `${arrivalHours}:${arrivalMinutes}`;
    }

    // 生成随机价格
    generatePrices() {
        const basePrice = Math.floor(Math.random() * 1000) + 500;
        return {
            economy: basePrice,
            business: Math.floor(basePrice * 3),
            first: Math.floor(basePrice * 6)
        };
    }

    // 生成随机座位数据
    generateSeats() {
        const maxSeats = {
            economy: 120,
            business: 30,
            first: 10
        };

        return {
            economy: Math.floor(Math.random() * maxSeats.economy),
            business: Math.floor(Math.random() * maxSeats.business),
            first: Math.floor(Math.random() * maxSeats.first)
        };
    }

    // 生成折扣信息
    generateDiscount() {
        if (Math.random() > 0.7) { // 30% 的航班有折扣
            const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed';
            const value = discountType === 'percentage' 
                ? Math.floor(Math.random() * 30 + 10) // 10-40% 折扣
                : Math.floor(Math.random() * 500 + 200); // 200-700元固定折扣
            
            return {
                type: discountType,
                value: value,
                endDate: this.generateDiscountEndDate()
            };
        }
        return null;
    }

    generateDiscountEndDate() {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7天的有效期
        return date.toISOString().split('T')[0];
    }

    // 生成单个航班数据
    generateFlight() {
        const from = this.cities[Math.floor(Math.random() * this.cities.length)];
        let to;
        do {
            to = this.cities[Math.floor(Math.random() * this.cities.length)];
        } while (to === from);

        const departureTime = this.generateTime();
        const flightDuration = Math.floor(Math.random() * 180) + 60; // 60-240分钟
        const arrivalTime = this.calculateArrivalTime(departureTime, flightDuration);

        return {
            id: this.generateFlightNumber(),
            from,
            to,
            departure: departureTime,
            arrival: arrivalTime,
            date: this.generateDate(),
            price: this.generatePrices(),
            bookedSeats: this.generateSeats(),
            status: Math.random() > 0.9 ? 'delayed' : 'ontime',
            duration: flightDuration,
            discount: this.generateDiscount()
        };
    }

    // 生成随机日期（未来30天内）
    generateDate() {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        return date.toISOString().split('T')[0];
    }

    // 生成多个航班数据
    generateFlights(count = 20) {
        return Array(count).fill(null).map(() => this.generateFlight());
    }

    // 更新现有航班数据
    updateFlight(flight) {
        // 随机更新座位信息
        flight.bookedSeats = this.generateSeats();
        // 随机更新状态
        flight.status = Math.random() > 0.9 ? 'delayed' : 'ontime';
        return flight;
    }
}

// 修改 FlightUpdater 类
class FlightUpdater {
    constructor(simulator) {
        this.simulator = simulator;
        this.interval = null;
        this.flights = [];
        this.isRunning = false;
        
        // 自动启动模拟器
        this.autoStart();
    }

    autoStart() {
        // 初始化航班数据
        this.flights = this.simulator.generateFlights(20);
        this.saveToStorage();
        this.isRunning = true;

        // 每5秒更新一次数据
        this.interval = setInterval(() => {
            this.updateFlights();
        }, 5000);

        // 每小时清理过期航班并添加新航班
        setInterval(() => {
            this.cleanupExpiredFlights();
        }, 3600000); // 1小时
    }

    updateFlights() {
        if (!this.isRunning) return;

        // 更新现有航班状态
        this.flights = this.flights.map(flight => {
            // 更新预订数据
            if (!flight.bookedSeats) {
                flight.bookedSeats = { economy: 0, business: 0, first: 0 };
            }

            // 模拟真实订票情况
            const timeUntilDeparture = this.getTimeUntilDeparture(flight);
            const bookingProbability = this.calculateBookingProbability(timeUntilDeparture);

            if (Math.random() < bookingProbability) {
                const seatType = this.getRandomSeatType();
                if (flight.bookedSeats[seatType] < this.getMaxSeats(seatType)) {
                    flight.bookedSeats[seatType]++;
                }
            }

            // 更新航班状态
            flight.status = this.updateFlightStatus(flight);

            return flight;
        });

        // 添加新航班
        if (Math.random() > 0.7) {
            const newFlight = this.simulator.generateFlight();
            this.flights.push(newFlight);
        }

        this.saveToStorage();
    }

    cleanupExpiredFlights() {
        const now = new Date();
        this.flights = this.flights.filter(flight => {
            const flightDate = new Date(flight.date + 'T' + flight.departure);
            return flightDate > now;
        });

        // 补充新航班
        while (this.flights.length < 20) {
            this.flights.push(this.simulator.generateFlight());
        }

        this.saveToStorage();
    }

    getTimeUntilDeparture(flight) {
        const now = new Date();
        const departure = new Date(flight.date + 'T' + flight.departure);
        return (departure - now) / (1000 * 60 * 60); // 小时数
    }

    calculateBookingProbability(hoursUntilDeparture) {
        if (hoursUntilDeparture < 0) return 0;
        if (hoursUntilDeparture < 2) return 0.8;
        if (hoursUntilDeparture < 6) return 0.6;
        if (hoursUntilDeparture < 24) return 0.4;
        if (hoursUntilDeparture < 72) return 0.2;
        return 0.1;
    }

    getRandomSeatType() {
        const rand = Math.random();
        if (rand < 0.7) return 'economy';
        if (rand < 0.9) return 'business';
        return 'first';
    }

    getMaxSeats(seatType) {
        const maxSeats = {
            economy: 120,
            business: 30,
            first: 10
        };
        return maxSeats[seatType];
    }

    updateFlightStatus(flight) {
        const hoursUntilDeparture = this.getTimeUntilDeparture(flight);
        
        // 航班起飞前2小时内有较高概率延误
        if (hoursUntilDeparture > 0 && hoursUntilDeparture < 2) {
            return Math.random() > 0.8 ? 'delayed' : 'ontime';
        }
        
        // 其他时间段较低概率延误
        return Math.random() > 0.95 ? 'delayed' : 'ontime';
    }

    saveToStorage() {
        localStorage.setItem('flights', JSON.stringify(this.flights));
        // 触发自定义事件通知页面更新
        window.dispatchEvent(new CustomEvent('flightsUpdated', {
            detail: { flights: this.flights }
        }));
    }

    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

// 自动初始化模拟器
const simulator = new FlightSimulator();
const updater = new FlightUpdater(simulator);

// 监听页面更新
window.addEventListener('flightsUpdated', (event) => {
    const flights = event.detail.flights;
    // 更新页面上的航班数据
    if (typeof updateFlightTable === 'function') {
        updateFlightTable(flights);
    }
}); 