// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title JobMarketplace
 * @notice Marketplace de trabajos con escrow en un unico token ERC-20.
 */
contract JobMarketplace {
    enum JobStatus {
        Open,
        Funded,
        Submitted,
        Completed,
        Rejected,
        Expired
    }

    struct Job {
        address client;
        address evaluator;
        address provider;
        string description;
        uint256 budget;
        uint256 expiresAt;
        JobStatus status;
        bytes32 deliverableRef;
        bytes32 resultReason;
    }

    IERC20 public immutable paymentToken;

    Job[] private jobs;
    bool private locked;

    error ZeroAddress();
    error InvalidBudget();
    error InvalidExpiration();
    error InvalidJob();
    error InvalidStatus();
    error Unauthorized();
    error ProviderAlreadySet();
    error JobNotExpired();
    error TokenTransferFailed();

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed evaluator,
        address provider,
        uint256 budget,
        uint256 expiresAt,
        string description
    );
    event ProviderSet(uint256 indexed jobId, address indexed provider);
    event JobFunded(uint256 indexed jobId);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverableRef);
    event JobCompleted(uint256 indexed jobId, bytes32 reason);
    event JobRejected(uint256 indexed jobId, bytes32 reason);
    event RefundClaimed(uint256 indexed jobId);

    modifier nonReentrant() {
        require(!locked, "REENTRANCY");
        locked = true;
        _;
        locked = false;
    }

    constructor(address token) {
        if (token == address(0)) revert ZeroAddress();

        paymentToken = IERC20(token);
    }

    /**
     * @notice Crea un trabajo Open. El evaluador es obligatorio y el proveedor es opcional.
     */
    function createJob(
        string calldata description,
        uint256 budget,
        address evaluator,
        address provider,
        uint256 expiresAt
    ) external returns (uint256 jobId) {
        if (budget == 0) revert InvalidBudget();
        if (evaluator == address(0)) revert ZeroAddress();
        if (expiresAt <= block.timestamp) revert InvalidExpiration();

        jobId = jobs.length;

        jobs.push(
            Job({
                client: msg.sender,
                evaluator: evaluator,
                provider: provider,
                description: description,
                budget: budget,
                expiresAt: expiresAt,
                status: JobStatus.Open,
                deliverableRef: bytes32(0),
                resultReason: bytes32(0)
            })
        );

        emit JobCreated(
            jobId,
            msg.sender,
            evaluator,
            provider,
            budget,
            expiresAt,
            description
        );
    }

    /**
     * @notice Asigna proveedor a un trabajo Open que aun no tiene proveedor.
     */
    function setProvider(uint256 jobId, address provider) external {
        Job storage job = _getExistingJob(jobId);

        if (msg.sender != job.client) revert Unauthorized();
        if (job.status != JobStatus.Open) revert InvalidStatus();
        if (job.provider != address(0)) revert ProviderAlreadySet();
        if (provider == address(0)) revert ZeroAddress();

        job.provider = provider;

        emit ProviderSet(jobId, provider);
    }

    /**
     * @notice Transfiere el presupuesto desde el cliente al escrow.
     */
    function fund(uint256 jobId) external nonReentrant {
        Job storage job = _getExistingJob(jobId);

        if (msg.sender != job.client) revert Unauthorized();
        if (job.status != JobStatus.Open) revert InvalidStatus();
        if (job.provider == address(0)) revert ZeroAddress();

        job.status = JobStatus.Funded;

        _safeTransferFrom(job.client, address(this), job.budget);

        emit JobFunded(jobId);
    }

    /**
     * @notice Registra la entrega off-chain y pasa el trabajo a Submitted.
     */
    function submit(uint256 jobId, bytes32 deliverableRef) external {
        Job storage job = _getExistingJob(jobId);

        if (msg.sender != job.provider) revert Unauthorized();
        if (job.status != JobStatus.Funded) revert InvalidStatus();

        job.deliverableRef = deliverableRef;
        job.status = JobStatus.Submitted;

        emit JobSubmitted(jobId, deliverableRef);
    }

    /**
     * @notice Libera el escrow al proveedor.
     */
    function complete(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = _getExistingJob(jobId);

        if (msg.sender != job.evaluator) revert Unauthorized();
        if (job.status != JobStatus.Submitted) revert InvalidStatus();
        if (job.provider == address(0)) revert ZeroAddress();

        job.status = JobStatus.Completed;
        job.resultReason = reason;

        _safeTransfer(job.provider, job.budget);

        emit JobCompleted(jobId, reason);
    }

    /**
     * @notice Rechaza un trabajo y reembolsa al cliente si ya estaba fondeado.
     */
    function reject(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = _getExistingJob(jobId);

        if (job.status == JobStatus.Open) {
            if (msg.sender != job.client) revert Unauthorized();

            job.status = JobStatus.Rejected;
            job.resultReason = reason;

            emit JobRejected(jobId, reason);
            return;
        }

        if (
            job.status != JobStatus.Funded &&
            job.status != JobStatus.Submitted
        ) {
            revert InvalidStatus();
        }
        if (msg.sender != job.evaluator) revert Unauthorized();

        job.status = JobStatus.Rejected;
        job.resultReason = reason;

        _safeTransfer(job.client, job.budget);

        emit JobRejected(jobId, reason);
    }

    /**
     * @notice Reembolsa al cliente si el trabajo vencio. Cualquiera puede llamarla.
     */
    function claimRefund(uint256 jobId) external nonReentrant {
        Job storage job = _getExistingJob(jobId);

        if (
            job.status != JobStatus.Funded &&
            job.status != JobStatus.Submitted
        ) {
            revert InvalidStatus();
        }
        if (block.timestamp <= job.expiresAt) revert JobNotExpired();

        job.status = JobStatus.Expired;

        _safeTransfer(job.client, job.budget);

        emit RefundClaimed(jobId);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        if (jobId >= jobs.length) revert InvalidJob();

        return jobs[jobId];
    }

    function jobCount() external view returns (uint256) {
        return jobs.length;
    }

    function _getExistingJob(uint256 jobId)
        private
        view
        returns (Job storage)
    {
        if (jobId >= jobs.length) revert InvalidJob();

        return jobs[jobId];
    }

    function _safeTransfer(address to, uint256 amount) private {
        bool success = paymentToken.transfer(to, amount);
        if (!success) revert TokenTransferFailed();
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 amount
    ) private {
        bool success = paymentToken.transferFrom(from, to, amount);
        if (!success) revert TokenTransferFailed();
    }
}
