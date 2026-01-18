import { Injectable } from '@nestjs/common';
import { Infermedica } from '../../common/external/infermedica/infermedica';
import { CheckDiagnosisDto } from './dto/check-diagnosis.dto';
import { SuggestedSymptomsDto } from './dto/suggested-symptoms.dto';
import { ParseTextDto } from './dto/parse-text.dto';
import { ExplainConditionDto } from './dto/explain-condition.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  HealthCheckup,
  HealthCheckupDocument,
} from './entities/health-checkup.entity';
import { Model, Types } from 'mongoose';
import { BeginCheckupDto } from './dto/begin-checkup.dto';
import { create, updateOne } from '../../common/crud/crud';
import { SearchQueryDto } from './dto/search-query.dto';

const { ObjectId } = Types;

@Injectable()
export class HealthCheckupService {
  constructor(
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
  ) {}

  // Create a new Infermedica instance for each health checkup session
  private createInfermedicaInstance(interviewId?: string) {
    return new Infermedica(interviewId);
  }

  // Note: Removed custom triage optimization methods - let Infermedica handle this

  // Duration mapping utility for Infermedica API
  private mapDurationToInfermedica(duration: string) {
    const durationMap = {
      'hours': { value: 1, unit: 'hour' },
      'days_1_3': { value: 2, unit: 'day' },
      'days_4_7': { value: 5, unit: 'day' },
      'weeks_1_2': { value: 10, unit: 'day' },
      'weeks_2_4': { value: 21, unit: 'day' },
      'months': { value: 60, unit: 'day' },
      'unknown': null
    };
    return durationMap[duration] || null;
  }

  // Process symptom evidence with duration support
  private processSymptomWithDuration(evidence: any[]) {
    console.log('Processing evidence items:', evidence.length);
    return evidence.map((item, index) => {
      const processedItem = { ...item };

      console.log(`Item ${index}:`, item.id, 'has duration:', item.duration, 'source:', item.source);

      // Add duration if provided
      if (item.duration && item.duration !== 'unknown') {
        console.log(`Processing duration for ${item.id}: ${item.duration}`);
        const durationData = this.mapDurationToInfermedica(item.duration);
        console.log(`Mapped duration:`, durationData);
        if (durationData) {
          console.log(`Setting duration for ${item.id} from "${item.duration}" to:`, durationData);
          processedItem.duration = durationData;
        }
      }

      // CRITICAL: Preserve 'source: initial' for Infermedica's should_stop algorithm
      // Only remove non-standard source values that Infermedica doesn't accept
      // Infermedica accepts: 'initial', 'suggest', 'predefined', 'red_flags'
      // Remove our custom 'interview' source marker
      if (processedItem.source && processedItem.source === 'interview') {
        delete processedItem.source;
      }

      return processedItem;
    });
  }

  // Enhanced diagnosis with symptom duration support
  async diagnosisWithDuration(
    checkDiagnosisDto: CheckDiagnosisDto,
    userId: Types.ObjectId,
    enableDuration: boolean = true
  ) {
    console.log('=== ENHANCED DIAGNOSIS START ===');
    try {
      // Validate minimum age for current subscription
      if (checkDiagnosisDto.age?.value < 12) {
        throw new Error('Health assessments are currently available for ages 12 and above. Pediatric features are not enabled in the current subscription. For children under 12, please consult with a pediatrician directly.');
      }

      const infermedica = this.createInfermedicaInstance(checkDiagnosisDto.interview_token);
      
      // Process evidence with duration support
      console.log('About to process evidence...');
      let processedEvidence;
      try {
        processedEvidence = this.processSymptomWithDuration(checkDiagnosisDto.evidence);
        console.log('Evidence processing completed');
      } catch (error) {
        console.error('Error processing evidence:', error);
        // Fall back to original evidence if processing fails
        processedEvidence = checkDiagnosisDto.evidence;
      }
      
      console.log('=== DURATION DEBUG ===');
      console.log('Original evidence:', JSON.stringify(checkDiagnosisDto.evidence, null, 2));
      console.log('Processed evidence:', JSON.stringify(processedEvidence, null, 2));
      
      // Let Infermedica handle triage optimization - don't filter evidence on our end
      const triageFocused = checkDiagnosisDto.extras?.triage_focused || false;
      
      // Enhanced request with duration support and intelligent triage
      const enhancedRequest = {
        ...checkDiagnosisDto,
        evidence: processedEvidence,
        extras: {
          enable_symptom_duration: enableDuration,
          // Only set interview_mode when triage is requested (Infermedica only accepts 'triage' value)
          ...(triageFocused && { interview_mode: 'triage' }),
          disable_groups: triageFocused, // Disable symptom groups for faster triage
          ...checkDiagnosisDto.extras
        }
      };

      console.log('=== FINAL REQUEST DEBUG ===');
      console.log('Enhanced request evidence length:', enhancedRequest.evidence?.length);
      console.log('Evidence with duration:');
      enhancedRequest.evidence?.forEach((item, index) => {
        if (item.duration) {
          console.log(`  ${index}: ${item.id} duration:`, item.duration, typeof item.duration);
        }
      });
      
      console.log('Final request to Infermedica:', JSON.stringify(enhancedRequest, null, 2));

      const response = await infermedica.diagnosis(enhancedRequest);

      // Check if interview is complete (should_stop from response or request)
      const isComplete = response?.data?.should_stop || checkDiagnosisDto.should_stop;

      // Save to database if this is the final diagnosis
      if (isComplete) {
        // Call triage endpoint to get urgency level
        let triageResponse: any = null;
        try {
          const triageRequest = {
            sex: checkDiagnosisDto.sex,
            age: checkDiagnosisDto.age,
            evidence: processedEvidence
          };
          triageResponse = await infermedica.triage(triageRequest);
          console.log('Triage response (enhanced):', JSON.stringify(triageResponse?.data, null, 2));
        } catch (triageError) {
          console.error('Error getting triage from Infermedica:', triageError);
          // Continue without triage data if it fails
        }

        const checkup = await this.healthCheckupModel
          .findOne({ user: userId })
          .sort({ created_at: -1 });
        if (checkup) {
          // Merge triage data into response
          const enrichedResponse = {
            ...response,
            data: {
              ...response.data,
              triage_level: triageResponse?.data?.triage_level || null,
              triage: triageResponse?.data || null
            }
          };

          await updateOne(
            this.healthCheckupModel,
            { _id: checkup._id },
            {
              request: enhancedRequest,
              response: enrichedResponse,
              interview_duration: checkDiagnosisDto.interview_duration || null,
              considered_diagnoses: checkDiagnosisDto.considered_diagnoses || checkDiagnosisDto.evidence?.length || 0,
              interview_token: checkDiagnosisDto.interview_token,
              has_symptom_duration: enableDuration
            },
          );

          return enrichedResponse;
        }
      }

      return response;
    } catch (error) {
      console.error('Error getting enhanced diagnosis from Infermedica:', error);
      throw new Error('Failed to get diagnosis. Please try again.');
    }
  }

  async beginCheckup(beginCheckupDto: BeginCheckupDto, userId: Types.ObjectId) {
    const { health_check_for, checkup_owner_id } = beginCheckupDto;
    // Generate a unique interview token for this checkup session
    const interview_token = new ObjectId().toString();
    return await create(this.healthCheckupModel, {
      user: userId,
      health_check_for,
      checkup_owner_id: checkup_owner_id || new ObjectId(),
      interview_token,
    });
  }

  async diagnosis(
    checkDiagnosisDto: CheckDiagnosisDto,
    userId: Types.ObjectId,
  ) {
    try {
      // Validate minimum age for current subscription
      if (checkDiagnosisDto.age?.value < 12) {
        throw new Error('Health assessments are currently available for ages 12 and above. Pediatric features are not enabled in the current subscription. For children under 12, please consult with a pediatrician directly.');
      }

      // Use interview_token if provided, otherwise generate new one
      const infermedica = this.createInfermedicaInstance(checkDiagnosisDto.interview_token);
      
      // Let Infermedica handle triage optimization - don't filter evidence on our end
      const triageFocused = checkDiagnosisDto.extras?.triage_focused || false;
      
      // Clean evidence by removing custom source fields, but preserve 'initial' source
      // CRITICAL: Infermedica requires 'source: initial' for should_stop to work
      const cleanedEvidence = checkDiagnosisDto.evidence?.map(item => {
        const cleanItem = { ...item };
        // Only remove our custom 'interview' source, preserve Infermedica-accepted sources
        if (cleanItem.source && cleanItem.source === 'interview') {
          delete cleanItem.source;
        }
        return cleanItem;
      }) || [];

      // Enhanced request with intelligent triage
      const optimizedRequest = {
        ...checkDiagnosisDto,
        evidence: cleanedEvidence,
        extras: {
          // Only set interview_mode when triage is requested (Infermedica only accepts 'triage' value)
          ...(triageFocused && { interview_mode: 'triage' }),
          disable_groups: triageFocused,
          ...checkDiagnosisDto.extras
        }
      };
      
      const response = await infermedica.diagnosis(optimizedRequest);

      // Check if interview is complete (should_stop from response or request)
      const isComplete = response?.data?.should_stop || checkDiagnosisDto.should_stop;

      if (isComplete) {
        // Call triage endpoint to get urgency level
        let triageResponse: any = null;
        try {
          const triageRequest = {
            sex: checkDiagnosisDto.sex,
            age: checkDiagnosisDto.age,
            evidence: cleanedEvidence
          };
          triageResponse = await infermedica.triage(triageRequest);
          console.log('Triage response:', JSON.stringify(triageResponse?.data, null, 2));
        } catch (triageError) {
          console.error('Error getting triage from Infermedica:', triageError);
          // Continue without triage data if it fails
        }

        const checkup = await this.healthCheckupModel
          .findOne({ user: userId })
          .sort({ created_at: -1 });
        if (checkup) {
          // Merge triage data into response
          const enrichedResponse = {
            ...response,
            data: {
              ...response.data,
              triage_level: triageResponse?.data?.triage_level || null,
              triage: triageResponse?.data || null
            }
          };

          await updateOne(
            this.healthCheckupModel,
            { _id: checkup._id },
            {
              request: checkDiagnosisDto,
              response: enrichedResponse,
              interview_duration: checkDiagnosisDto.interview_duration || null,
              considered_diagnoses: checkDiagnosisDto.considered_diagnoses || checkDiagnosisDto.evidence?.length || 0,
              interview_token: checkDiagnosisDto.interview_token
            },
          );
          // Include checkup_id in response for Claude summary feature
          return {
            ...enrichedResponse,
            data: {
              ...enrichedResponse.data,
              checkup_id: checkup._id.toString()
            }
          };
        }
      }
      return response;
    } catch (error) {
      console.error('Error getting diagnosis from Infermedica:', error);
      throw new Error('Failed to get diagnosis. Please try again.');
    }
  }

  async getRiskFactors(age: number, interviewToken?: string) {
    try {
      const infermedica = this.createInfermedicaInstance(interviewToken);
      return await infermedica.getRiskFactors(age);
    } catch (error) {
      console.error('Error getting risk factors from Infermedica:', error);
      throw new Error('Failed to retrieve risk factors. Please try again.');
    }
  }

  async getSuggestedSymptoms(suggestedSymptomsDto: SuggestedSymptomsDto, interviewToken?: string) {
    try {
      const infermedica = this.createInfermedicaInstance(interviewToken);
      return await infermedica.getSuggestedSymptoms(suggestedSymptomsDto);
    } catch (error) {
      console.error('Error getting suggested symptoms from Infermedica:', error);
      throw new Error('Failed to retrieve symptom suggestions. Please try again.');
    }
  }

  // Enhanced NLP text parsing with better error handling and typo tolerance
  async parseFreeText(parseTextDto: ParseTextDto, interviewToken?: string) {
    try {
      const infermedica = this.createInfermedicaInstance(interviewToken);
      
      // Enhanced request with improved NLP features
      const enhancedRequest = {
        ...parseTextDto,
        extras: {
          enable_typo_tolerance: true,
          enable_enhanced_nlp: true,
          max_suggestions: 10,
          include_raw_mentions: true,
          ...parseTextDto.extras
        }
      };
      
      const response = await infermedica.parseFreeText(enhancedRequest);
      
      // Enhanced error handling - check for parsing quality
      if (response?.data?.mentions?.length === 0 && parseTextDto.text?.length > 0) {
        // If no mentions found, try with relaxed parsing
        const relaxedRequest = {
          ...enhancedRequest,
          extras: {
            ...enhancedRequest.extras,
            enable_fuzzy_matching: true,
            relaxed_parsing: true
          }
        };
        
        const relaxedResponse = await infermedica.parseFreeText(relaxedRequest);
        return relaxedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Error parsing free text with Infermedica:', error);
      
      // Enhanced error handling with more specific messages
      if (error.response?.status === 400) {
        throw new Error('The text provided could not be understood. Please try describing your symptoms differently.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Medical text analysis service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error('Failed to parse symptoms from text. Please try again.');
    }
  }

  async explainCondition(explainConditionDto: ExplainConditionDto, interviewToken?: string) {
    try {
      const infermedica = this.createInfermedicaInstance(interviewToken);
      return await infermedica.explain(explainConditionDto);
    } catch (error) {
      console.error('Error explaining condition with Infermedica:', error);
      throw new Error('Failed to explain medical condition. Please try again.');
    }
  }

  // Enhanced search with improved NLP and typo tolerance
  async search(searchQueryDto: SearchQueryDto, interviewToken?: string) {
    try {
      const infermedica = this.createInfermedicaInstance(interviewToken);
      
      // Enhanced search with NLP improvements
      const enhancedQuery = {
        ...searchQueryDto,
        extras: {
          enable_typo_tolerance: true,
          enable_fuzzy_matching: true,
          include_synonyms: true,
          ...searchQueryDto.extras
        }
      };
      
      const response = await infermedica.search(enhancedQuery);
      
      // If no results and query has potential typos, try with corrected spelling
      if (response?.data?.length === 0 && searchQueryDto.phrase?.length > 2) {
        // Try with more relaxed matching
        const relaxedQuery = {
          ...enhancedQuery,
          extras: {
            ...enhancedQuery.extras,
            relaxed_matching: true,
            minimum_confidence: 0.3 // Lower confidence threshold
          }
        };
        
        const relaxedResponse = await infermedica.search(relaxedQuery);
        return relaxedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Error searching with Infermedica:', error);
      
      // Enhanced error handling
      if (error.response?.status === 400) {
        throw new Error('Search query could not be processed. Please try different keywords.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many search requests. Please wait a moment and try again.');
      }
      
      throw new Error('Failed to search for symptoms. Please try again.');
    }
  }

  async getHealthCheckupResults(userId: string) {
    const checkups = await this.healthCheckupModel.find({
      user: userId,
      deleted_at: { $exists: false }
    }).sort({ created_at: -1 });
    return checkups;
  }

  async getHealthCheckupHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = { [sortBy]: sortDirection };

    // Filter to exclude soft-deleted records
    const filter = { user: userId, deleted_at: { $exists: false } };

    const [checkups, total] = await Promise.all([
      this.healthCheckupModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.healthCheckupModel.countDocuments(filter)
    ]);

    return {
      checkups,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
        per_page: limit
      }
    };
  }

  async deleteHealthCheckup(checkupId: string, userId: string) {
    const checkup = await this.healthCheckupModel.findOne({
      _id: checkupId,
      user: userId,
      deleted_at: { $exists: false }
    });

    if (!checkup) {
      throw new Error('Health checkup not found or you do not have permission to delete it');
    }

    // Soft delete - set deleted_at timestamp instead of removing the record
    await this.healthCheckupModel.updateOne(
      { _id: checkupId, user: userId },
      { $set: { deleted_at: new Date() } }
    );

    return { deleted: true, checkupId };
  }

  async getExtendedDiagnosis(
    extendedDiagnosisDto: { 
      interview_token: string; 
      min_probability?: number; 
      limit?: number 
    },
    userId: Types.ObjectId
  ) {
    try {
      // Get the latest checkup for this user to retrieve the evidence
      const checkup = await this.healthCheckupModel
        .findOne({ user: userId })
        .sort({ created_at: -1 });
        
      if (!checkup || !checkup.request) {
        throw new Error('No recent health checkup found');
      }

      // Clean evidence by removing invalid source values before sending to Infermedica
      // Infermedica only accepts: 'initial', 'suggest', 'predefined', 'red_flags'
      const cleanedEvidence = (checkup.request.evidence || []).map(item => {
        const cleanItem = { ...item };
        if (cleanItem.source && cleanItem.source === 'interview') {
          delete cleanItem.source;
        }
        return cleanItem;
      });

      // Create a clean diagnosis request - avoid extras that might limit results
      // Infermedica returns up to 20 conditions based on probability distribution
      const extendedRequest = {
        sex: checkup.request.sex,
        age: checkup.request.age,
        evidence: cleanedEvidence,
        interview_token: extendedDiagnosisDto.interview_token,
        // Minimal extras - some extras can actually limit results
        extras: {
          include_condition_details: true
        }
      };

      console.log('Extended diagnosis request - evidence count:', cleanedEvidence.length);

      // Call Infermedica API with modified parameters
      const infermedica = this.createInfermedicaInstance(extendedDiagnosisDto.interview_token);
      
      // Get extended diagnosis with more conditions
      const response = await infermedica.diagnosis(extendedRequest);
      
      // If Infermedica still returns limited conditions, we can try to get more
      // by adjusting the request or making multiple calls with different parameters
      let allConditions = response?.data?.conditions || [];
      
      // Sort by probability and apply our own filtering
      if (extendedDiagnosisDto.min_probability) {
        const minProb = extendedDiagnosisDto.min_probability;
        allConditions = allConditions.filter(
          c => c.probability >= minProb
        );
      }
      
      // Limit the results if specified
      if (extendedDiagnosisDto.limit) {
        allConditions = allConditions.slice(0, extendedDiagnosisDto.limit);
      }
      
      return {
        conditions: allConditions,
        total_count: allConditions.length,
        min_probability_used: extendedDiagnosisDto.min_probability || 0.01,
        interview_token: extendedDiagnosisDto.interview_token
      };
      
    } catch (error) {
      console.error('Error getting extended diagnosis:', error);
      throw new Error('Failed to retrieve extended diagnosis conditions');
    }
  }

  async getInfermedicaSettings() {
    try {
      const infermedica = this.createInfermedicaInstance();
      return await infermedica.getSettings();
    } catch (error) {
      console.error('Error getting Infermedica settings:', error);
      throw new Error('Failed to retrieve API settings. Please check your API credentials.');
    }
  }

  /**
   * Get the Claude AI summary for a health checkup
   * Returns stored summary from DB if available, or null if not generated
   */
  async getClaudeSummary(checkupId: string) {
    try {
      const checkup = await this.healthCheckupModel.findById(checkupId);

      if (!checkup) {
        throw new Error('Health checkup not found');
      }

      return {
        checkup_id: checkupId,
        claude_summary: checkup.claude_summary || null,
        has_summary: !!checkup.claude_summary?.content
      };
    } catch (error) {
      console.error('Error getting Claude summary:', error);
      throw error;
    }
  }

  /**
   * Store a generated Claude summary for a health checkup
   */
  async storeClaudeSummary(checkupId: string, summaryData: any) {
    try {
      const updatedCheckup = await this.healthCheckupModel.findByIdAndUpdate(
        checkupId,
        {
          claude_summary: {
            generated_at: summaryData.generated_at || new Date(),
            model: summaryData.model,
            content: summaryData.content,
            error: summaryData.error || null
          }
        },
        { new: true }
      );

      if (!updatedCheckup) {
        throw new Error('Health checkup not found');
      }

      return {
        checkup_id: checkupId,
        claude_summary: updatedCheckup.claude_summary,
        stored_at: new Date()
      };
    } catch (error) {
      console.error('Error storing Claude summary:', error);
      throw error;
    }
  }

  /**
   * Get checkup details needed for Claude summary generation
   */
  async getCheckupForClaudeSummary(checkupId: string) {
    try {
      const checkup = await this.healthCheckupModel.findById(checkupId);

      if (!checkup) {
        throw new Error('Health checkup not found');
      }

      return {
        checkup_id: checkupId,
        user_id: checkup.user,
        response: checkup.response,
        request: checkup.request,
        claude_summary: checkup.claude_summary || null
      };
    } catch (error) {
      console.error('Error getting checkup for Claude summary:', error);
      throw error;
    }
  }
}
