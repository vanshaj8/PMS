package com.pip.core.repository;

import com.pip.core.model.WorkflowPhase;
import com.pip.core.model.WorkflowContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowPhaseRepository extends JpaRepository<WorkflowPhase, String> {
    List<WorkflowPhase> findByWorkflowId(String workflowId);
    List<WorkflowPhase> findByWorkflowIdOrderBySequenceOrderAsc(String workflowId);
    Optional<WorkflowPhase> findByWorkflowIdAndSequenceOrder(String workflowId, Integer sequenceOrder);
    List<WorkflowPhase> findByWorkflowIdAndSequenceOrderLessThan(String workflowId, Integer sequenceOrder);
    List<WorkflowPhase> findByWorkflowContext(WorkflowContext context);
}

