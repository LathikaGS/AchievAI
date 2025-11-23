import { Pool } from "pg";
import type { User, InsertUser, Habit, InsertHabit, Feedback, InsertFeedback } from "@shared/schema";

export class DbStorage {
    constructor(private pool: Pool) { }

    // ---------------- Users ----------------
    async getUser(id: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
            if (!result.rows.length) return undefined;
            const row = result.rows[0];
            return this.mapUser(row);
        } catch (err) {
            console.error("getUser error:", err);
            throw err;
        }
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
            if (!result.rows.length) return undefined;
            const row = result.rows[0];
            return this.mapUser(row);
        } catch (err) {
            console.error("getUserByEmail error:", err);
            throw err;
        }
    }

    async createUser(data: InsertUser & { password: string }): Promise<User> {
        try {
            const result = await this.pool.query(
                `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [data.username, data.email, data.password]
            );
            return this.mapUser(result.rows[0]);
        } catch (err) {
            console.error("createUser error:", err);
            throw err;
        }
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        try {
            const fields: string[] = [];
            const values: any[] = [];
            let i = 1;

            for (const key of Object.keys(updates)) {
                if (key === "password") fields.push(`password_hash = $${i}`);
                else if (key === "focusXp") fields.push(`focus_xp = $${i}`);
                else fields.push(`${key} = $${i}`);
                values.push((updates as any)[key]);
                i++;
            }
            if (!fields.length) return this.getUser(id);

            values.push(id);
            const result = await this.pool.query(
                `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
                values
            );
            if (!result.rows.length) return undefined;
            return this.mapUser(result.rows[0]);
        } catch (err) {
            console.error("updateUser error:", err);
            throw err;
        }
    }

    // ---------------- Habits ----------------
    async getHabitsByUserId(userId: string): Promise<Habit[]> {
        const result = await this.pool.query(
            `SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows.map((row) => ({
            id: row.habit_id,
            userId: row.user_id,
            title: row.habit_name,       // <- Use 'title' for UI
            description: row.frequency,  // <- Store description in frequency or add a new column
            completed: row.completed,
            completedDates: row.completed_dates,
            xpReward: row.xp_reward,
            createdAt: row.created_at,
        }));
    }


    async getHabit(id: string): Promise<Habit | undefined> {
        const result = await this.pool.query(`SELECT * FROM habits WHERE habit_id = $1`, [id]);
        if (!result.rows.length) return undefined;
        const row = result.rows[0];
        return {
            id: row.habit_id,
            userId: row.user_id,
            habit_name: row.habit_name,
            frequency: row.frequency,
            completed: row.completed,
            completedDates: row.completed_dates,
            xpReward: row.xp_reward,
            createdAt: row.created_at,
        };
    }

    async createHabit(data: InsertHabit & { userId: string }): Promise<Habit> {
        if (!data.habit_name) throw new Error("habit_name is required");

        const result = await this.pool.query(
            `INSERT INTO habits (user_id, habit_name, frequency, completed, xp_reward, created_at)
         VALUES ($1, $2, $3, false, 10, NOW())
         RETURNING *`,
            [data.userId, data.habit_name, data.frequency || null]
        );
        const row = result.rows[0];
        return {
            id: row.habit_id,
            userId: row.user_id,
            habit_name: row.habit_name,
            frequency: row.frequency,
            completed: row.completed,
            completedDates: row.completed_dates,
            xpReward: row.xp_reward,
            createdAt: row.created_at,
        };
    }

    async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        for (const key of Object.keys(updates)) {
            if (key === "completedDates") fields.push(`completed_dates = $${i}`);
            else if (key === "xpReward") fields.push(`xp_reward = $${i}`);
            else fields.push(`${key} = $${i}`);
            values.push((updates as any)[key]);
            i++;
        }
        if (!fields.length) return this.getHabit(id);

        values.push(id);
        const result = await this.pool.query(
            `UPDATE habits SET ${fields.join(", ")} WHERE habit_id = $${i} RETURNING *`,
            values
        );
        if (!result.rows.length) return undefined;
        const row = result.rows[0];
        return {
            id: row.habit_id,
            userId: row.user_id,
            habit_name: row.habit_name,
            frequency: row.frequency,
            completed: row.completed,
            completedDates: row.completed_dates,
            xpReward: row.xp_reward,
            createdAt: row.created_at,
        };
    }

    async deleteHabit(id: string): Promise<boolean> {
        await this.pool.query(`DELETE FROM habits WHERE habit_id = $1`, [id]);
        return true;
    }

    // ---------------- Habit Logs ----------------

    async completeHabit(habitId: string): Promise<Habit | undefined> {
        // 1. Fetch the habit
        const habitResult = await this.pool.query(`SELECT * FROM habits WHERE habit_id = $1`, [habitId]);
        if (!habitResult.rows.length) return undefined;
        const habit = habitResult.rows[0];

        // 2. Add current date to completed_dates
        const updatedDates = [...habit.completed_dates, new Date()];

        // 3. Update habit completed info
        const updatedHabitResult = await this.pool.query(
            `UPDATE habits 
         SET completed = true, completed_dates = $1 
         WHERE habit_id = $2 
         RETURNING *`,
            [updatedDates, habitId]
        );

        const updatedHabit = updatedHabitResult.rows[0];

        // 4. Insert into habit_logs
        await this.pool.query(
            `INSERT INTO habit_logs (habit_id, completed_at) VALUES ($1, NOW())`,
            [habitId]
        );

        // 5. Add XP to the user
        if (habit.user_id && habit.xp_reward) {
            await this.pool.query(
                `UPDATE users SET xp = xp + $1 WHERE id = $2`,
                [habit.xp_reward, habit.user_id]
            );
        }

        return {
            id: updatedHabit.habit_id,
            userId: updatedHabit.user_id,
            title: updatedHabit.habit_name,
            description: updatedHabit.frequency,
            completed: updatedHabit.completed,
            completedDates: updatedHabit.completed_dates,
            xpReward: updatedHabit.xp_reward,
            createdAt: updatedHabit.created_at,
        };
    }

    // ---------------- Feedback ----------------
    async createFeedback(data: InsertFeedback & { userId?: string }): Promise<Feedback> {
        try {
            const result = await this.pool.query(
                `INSERT INTO feedback (user_id, message)
         VALUES ($1, $2)
         RETURNING *`,
                [data.userId || null, data.message]
            );
            return this.mapFeedback(result.rows[0]);
        } catch (err) {
            console.error("createFeedback error:", err);
            throw err;
        }
    }

    // ---------------- Mapping ----------------
    private mapUser(row: any): User {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            password: row.password_hash,
            xp: row.xp,
            level: row.level,
            streak: row.streak,
            focusXp: row.focus_xp,
            createdAt: row.created_at,
        };
    }

    private mapHabit(row: any): Habit {
        return {
            id: row.habit_id,
            userId: row.user_id,
            habit_name: row.habit_name,
            frequency: row.frequency,
            completed: row.completed,
            completedDates: row.completed_dates,
            xpReward: row.xp_reward,
            createdAt: row.created_at,
        };
    }

    private mapFeedback(row: any): Feedback {
        return {
            id: row.feedback_id,
            userId: row.user_id,
            message: row.message,
            createdAt: row.created_at,
        };
    }
}
