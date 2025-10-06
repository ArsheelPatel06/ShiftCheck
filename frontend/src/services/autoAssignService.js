import { userService, shiftService } from './dataService';

/**
 * Auto-assignment algorithm for healthcare shifts
 * Considers staff availability, skills, workload, and preferences
 */
export class AutoAssignService {
    /**
     * Auto-assign a shift to the best available staff member
     * @param {string} shiftId - The ID of the shift to assign
     * @returns {Promise<Object>} Assignment result
     */
    static async autoAssignShift(shiftId) {
        try {
            // Validate input
            if (!shiftId || typeof shiftId !== 'string') {
                throw new Error('Invalid shift ID provided');
            }

            // Get shift details with error handling
            const shift = await shiftService.getById(shiftId);
            if (!shift) {
                throw new Error('Shift not found');
            }

            // Validate shift data
            if (!shift.department || !shift.startTime || !shift.endTime) {
                throw new Error('Invalid shift data: missing required fields');
            }

            // Get all available staff with error handling
            const allStaff = await userService.getAll();
            if (!Array.isArray(allStaff)) {
                throw new Error('Failed to fetch staff data');
            }

            const availableStaff = allStaff.filter(staff => {
                // Enhanced validation
                if (!staff || typeof staff !== 'object') return false;
                if (staff.role !== 'staff') return false;
                if (staff.status !== 'active' && staff.status !== 'available') return false;
                if (!staff.id && !staff._id) return false;
                return true;
            });

            if (availableStaff.length === 0) {
                throw new Error('No available staff members found');
            }

            // Find the best match with error handling
            const bestMatch = this.findBestMatch(shift, availableStaff);

            if (!bestMatch) {
                throw new Error('No suitable staff member found for this shift');
            }

            // Validate best match
            if (!bestMatch.id && !bestMatch._id) {
                throw new Error('Invalid staff member data');
            }

            // Assign the shift with error handling
            const staffId = bestMatch.id || bestMatch._id;
            await shiftService.assignShift(shiftId, staffId);

            return {
                success: true,
                assignedTo: bestMatch,
                shift: shift,
                reason: bestMatch.assignmentReason || 'Best match based on skills and availability'
            };

        } catch (error) {
            console.error('Auto-assignment failed:', error);

            // Enhanced error handling
            if (error.message.includes('quota exceeded')) {
                throw new Error('Service temporarily unavailable. Please try again later.');
            } else if (error.message.includes('network')) {
                throw new Error('Network error. Please check your connection.');
            } else if (error.message.includes('permission')) {
                throw new Error('Permission denied. Please contact administrator.');
            }

            throw error;
        }
    }

    /**
     * Find the best staff member for a shift
     * @param {Object} shift - The shift to assign
     * @param {Array} availableStaff - Array of available staff
     * @returns {Object|null} Best matching staff member
     */
    static findBestMatch(shift, availableStaff) {
        try {
            // Validate inputs
            if (!shift || typeof shift !== 'object') {
                throw new Error('Invalid shift data');
            }
            if (!Array.isArray(availableStaff) || availableStaff.length === 0) {
                throw new Error('No available staff provided');
            }

            const scoredStaff = availableStaff.map(staff => {
                try {
                    // Validate staff data
                    if (!staff || typeof staff !== 'object') {
                        console.warn('Invalid staff data:', staff);
                        return null;
                    }

                    const score = this.calculateAssignmentScore(shift, staff);
                    if (isNaN(score) || score < 0) {
                        console.warn('Invalid score calculated for staff:', staff.name || staff.id);
                        return null;
                    }

                    return {
                        ...staff,
                        assignmentScore: score,
                        assignmentReason: this.getAssignmentReason(shift, staff, score)
                    };
                } catch (error) {
                    console.error('Error processing staff member:', error, staff);
                    return null;
                }
            }).filter(staff => staff !== null); // Remove null entries

            if (scoredStaff.length === 0) {
                throw new Error('No valid staff members found after scoring');
            }

            // Sort by score (highest first)
            scoredStaff.sort((a, b) => {
                const scoreA = a.assignmentScore || 0;
                const scoreB = b.assignmentScore || 0;
                return scoreB - scoreA;
            });

            // Return the best match if score is above threshold
            const bestMatch = scoredStaff[0];
            const threshold = 20; // Minimum score threshold

            if (bestMatch && bestMatch.assignmentScore > threshold) {
                return bestMatch;
            } else {
                console.warn('No staff member meets minimum score threshold:', bestMatch?.assignmentScore);
                return null;
            }
        } catch (error) {
            console.error('Error in findBestMatch:', error);
            return null;
        }
    }

    /**
     * Calculate assignment score for a staff member
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {number} Assignment score (0-100)
     */
    static calculateAssignmentScore(shift, staff) {
        let score = 0;

        // 1. Availability check (30 points)
        if (this.isAvailable(shift, staff)) {
            score += 30;
        } else {
            return 0; // Not available, skip this staff member
        }

        // 2. Skills match (25 points)
        const skillsScore = this.calculateSkillsScore(shift, staff);
        score += skillsScore;

        // 3. Workload balance (20 points)
        const workloadScore = this.calculateWorkloadScore(shift, staff);
        score += workloadScore;

        // 4. Department preference (15 points)
        const departmentScore = this.calculateDepartmentScore(shift, staff);
        score += departmentScore;

        // 5. Shift preference (10 points)
        const shiftPreferenceScore = this.calculateShiftPreferenceScore(shift, staff);
        score += shiftPreferenceScore;

        return Math.min(score, 100); // Cap at 100
    }

    /**
     * Check if staff member is available for the shift
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {boolean} Is available
     */
    static isAvailable(shift, staff) {
        const shiftStart = new Date(shift.startTime);
        const shiftEnd = new Date(shift.endTime);

        // Check if staff has any conflicting shifts
        if (staff.shifts) {
            for (const existingShift of staff.shifts) {
                const existingStart = new Date(existingShift.startTime);
                const existingEnd = new Date(existingShift.endTime);

                // Check for time overlap
                if (shiftStart < existingEnd && shiftEnd > existingStart) {
                    return false;
                }
            }
        }

        // Check if staff is on leave
        if (staff.leaveRequests) {
            for (const leave of staff.leaveRequests) {
                if (leave.status === 'approved') {
                    const leaveStart = new Date(leave.startDate);
                    const leaveEnd = new Date(leave.endDate);

                    if (shiftStart >= leaveStart && shiftStart <= leaveEnd) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Calculate skills match score
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {number} Skills score (0-25)
     */
    static calculateSkillsScore(shift, staff) {
        if (!shift.requiredSkills || shift.requiredSkills.length === 0) {
            return 15; // No specific requirements, give base score
        }

        const staffSkills = staff.skills || [];
        const requiredSkills = shift.requiredSkills;
        const matchingSkills = requiredSkills.filter(skill =>
            staffSkills.includes(skill)
        );

        const matchPercentage = (matchingSkills.length / requiredSkills.length) * 100;
        return Math.round((matchPercentage / 100) * 25);
    }

    /**
     * Calculate workload balance score
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {number} Workload score (0-20)
     */
    static calculateWorkloadScore(shift, staff) {
        const currentWorkload = staff.currentWorkload || 0;
        const maxWorkload = staff.maxWorkload || 40; // Default 40 hours/week

        // Prefer staff with lower current workload
        const workloadPercentage = (currentWorkload / maxWorkload) * 100;

        if (workloadPercentage >= 100) {
            return 0; // Overloaded
        } else if (workloadPercentage >= 80) {
            return 5; // High workload
        } else if (workloadPercentage >= 60) {
            return 10; // Medium workload
        } else if (workloadPercentage >= 40) {
            return 15; // Normal workload
        } else {
            return 20; // Low workload
        }
    }

    /**
     * Calculate department preference score
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {number} Department score (0-15)
     */
    static calculateDepartmentScore(shift, staff) {
        const staffDepartment = staff.department;
        const shiftDepartment = shift.department;

        if (staffDepartment === shiftDepartment) {
            return 15; // Same department
        } else if (staff.preferredDepartments &&
            staff.preferredDepartments.includes(shiftDepartment)) {
            return 10; // Preferred department
        } else {
            return 5; // Different department
        }
    }

    /**
     * Calculate shift preference score
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @returns {number} Shift preference score (0-10)
     */
    static calculateShiftPreferenceScore(shift, staff) {
        const shiftType = shift.shiftType;
        const staffPreferences = staff.shiftPreferences || {};

        switch (shiftType) {
            case 'morning':
                return staffPreferences.morning || 5;
            case 'afternoon':
                return staffPreferences.afternoon || 5;
            case 'evening':
                return staffPreferences.evening || 5;
            case 'night':
                return staffPreferences.night || 5;
            default:
                return 5;
        }
    }

    /**
     * Get assignment reason for display
     * @param {Object} shift - The shift details
     * @param {Object} staff - The staff member details
     * @param {number} score - The assignment score
     * @returns {string} Assignment reason
     */
    static getAssignmentReason(shift, staff, score) {
        const reasons = [];

        if (score >= 80) {
            reasons.push('Excellent match');
        } else if (score >= 60) {
            reasons.push('Good match');
        } else if (score >= 40) {
            reasons.push('Adequate match');
        }

        // Add specific reasons
        if (staff.department === shift.department) {
            reasons.push('Same department');
        }

        if (shift.requiredSkills && staff.skills) {
            const matchingSkills = shift.requiredSkills.filter(skill =>
                staff.skills.includes(skill)
            );
            if (matchingSkills.length > 0) {
                reasons.push(`${matchingSkills.length} required skills`);
            }
        }

        const currentWorkload = staff.currentWorkload || 0;
        if (currentWorkload < 30) {
            reasons.push('Low workload');
        }

        return reasons.join(', ') || 'Available staff member';
    }

    /**
     * Get auto-assignment suggestions for a shift
     * @param {string} shiftId - The shift ID
     * @returns {Promise<Array>} Array of suggested staff with scores
     */
    static async getAssignmentSuggestions(shiftId) {
        try {
            const shift = await shiftService.getById(shiftId);
            const allStaff = await userService.getAll();
            const availableStaff = allStaff.filter(staff =>
                staff.role === 'staff' &&
                staff.status === 'active'
            );

            const suggestions = availableStaff
                .map(staff => {
                    const score = this.calculateAssignmentScore(shift, staff);
                    return {
                        ...staff,
                        assignmentScore: score,
                        assignmentReason: this.getAssignmentReason(shift, staff, score)
                    };
                })
                .filter(staff => staff.assignmentScore > 0)
                .sort((a, b) => b.assignmentScore - a.assignmentScore);

            return suggestions;
        } catch (error) {
            console.error('Error getting assignment suggestions:', error);
            throw error;
        }
    }
}

export default AutoAssignService;